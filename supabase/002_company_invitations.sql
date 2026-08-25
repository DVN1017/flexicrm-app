-- FlexiCRM - Module Membres / Invitations
-- Execute this script after 001_companies.sql in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  invited_email text not null,
  proposed_role text not null check (proposed_role in ('admin', 'member')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_invitations_email_lowercase check (invited_email = lower(invited_email))
);

create index if not exists idx_company_invitations_company_id on public.company_invitations (company_id);
create index if not exists idx_company_invitations_status on public.company_invitations (status);
create index if not exists idx_company_invitations_token on public.company_invitations (token);

-- Ensure one active pending invitation per email/company to avoid duplicate invite spam.
create unique index if not exists uq_company_invitations_pending_email
on public.company_invitations (company_id, invited_email)
where status = 'pending';

create or replace function public.company_invitations_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_company_invitations_set_updated_at on public.company_invitations;
create trigger trg_company_invitations_set_updated_at
before update on public.company_invitations
for each row
execute function public.company_invitations_set_updated_at();

create or replace function public.company_invitations_normalize_email()
returns trigger
language plpgsql
as $$
begin
  new.invited_email = lower(trim(new.invited_email));
  return new;
end;
$$;

drop trigger if exists trg_company_invitations_normalize_email on public.company_invitations;
create trigger trg_company_invitations_normalize_email
before insert or update on public.company_invitations
for each row
execute function public.company_invitations_normalize_email();

alter table public.company_invitations enable row level security;
alter table public.company_invitations force row level security;

-- Owners/admins can read invitations from their own company only.
drop policy if exists company_invitations_select_admin on public.company_invitations;
create policy company_invitations_select_admin
on public.company_invitations
for select
to authenticated
using (public.is_company_admin(company_id));

-- Owners/admins can create invitations for their own company.
drop policy if exists company_invitations_insert_admin on public.company_invitations;
create policy company_invitations_insert_admin
on public.company_invitations
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and created_by = auth.uid()
  and proposed_role in ('admin', 'member')
  and status = 'pending'
);

-- Owners/admins can update/delete invitations for their own company.
drop policy if exists company_invitations_update_admin on public.company_invitations;
create policy company_invitations_update_admin
on public.company_invitations
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists company_invitations_delete_admin on public.company_invitations;
create policy company_invitations_delete_admin
on public.company_invitations
for delete
to authenticated
using (public.is_company_admin(company_id));

-- Public, token-based invitation lookup used by invite acceptance page.
create or replace function public.get_invitation_context(p_token text)
returns table(
  company_name text,
  invited_email text,
  proposed_role text,
  status text,
  expires_at timestamptz,
  is_valid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with invitation as (
    select
      ci.invited_email,
      ci.proposed_role,
      ci.status,
      ci.expires_at,
      c.name as company_name
    from public.company_invitations ci
    join public.companies c on c.id = ci.company_id
    where ci.token = p_token
    limit 1
  )
  select
    invitation.company_name,
    invitation.invited_email,
    invitation.proposed_role,
    invitation.status,
    invitation.expires_at,
    (
      invitation.status = 'pending'
      and invitation.expires_at > now()
    ) as is_valid
  from invitation;
$$;

grant execute on function public.get_invitation_context(text) to anon, authenticated;

-- Helper function used by dashboard/team to list members with email.
create or replace function public.list_company_members_for_current_user()
returns table(
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with current_company as (
    select cm.company_id
    from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.status = 'active'
    limit 1
  )
  select
    cm.user_id,
    coalesce(
      au.email::text,
      case when cm.user_id = auth.uid() then auth.jwt() ->> 'email' else null end,
      ''
    ) as email,
    cm.role,
    cm.status,
    cm.created_at
  from public.company_members cm
  join current_company cc on cc.company_id = cm.company_id
  left join auth.users au on au.id = cm.user_id
  order by cm.created_at asc;
$$;

grant execute on function public.list_company_members_for_current_user() to authenticated;

-- Auto-accept pending invitation after invited user signs up.
create or replace function public.accept_invitation_on_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_token text;
  v_company_id uuid;
  v_role text;
begin
  v_token := coalesce(new.raw_user_meta_data ->> 'invitation_token', '');

  if v_token = '' then
    return new;
  end if;

  select ci.company_id, ci.proposed_role
  into v_company_id, v_role
  from public.company_invitations ci
  where ci.token = v_token
    and ci.status = 'pending'
    and ci.expires_at > now()
    and ci.invited_email = lower(new.email)
  for update;

  if not found then
    return new;
  end if;

  begin
    insert into public.company_members (company_id, user_id, role, status)
    values (v_company_id, new.id, v_role, 'active');

    update public.company_invitations
    set
      status = 'accepted',
      accepted_at = now(),
      accepted_user_id = new.id,
      updated_at = now()
    where token = v_token;
  exception
    when unique_violation then
      -- If user already belongs to a company, keep invitation pending to allow admin review.
      null;
  end;

  return new;
end;
$$;

drop trigger if exists trg_accept_invitation_on_user_created on auth.users;
create trigger trg_accept_invitation_on_user_created
after insert on auth.users
for each row
execute function public.accept_invitation_on_user_created();

-- Utility to expire stale invitations.
create or replace function public.expire_stale_company_invitations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.company_invitations
  set status = 'expired', updated_at = now()
  where status = 'pending'
    and expires_at <= now();
$$;

grant execute on function public.expire_stale_company_invitations() to authenticated;

commit;
