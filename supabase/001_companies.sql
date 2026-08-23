-- FlexiCRM - Module Entreprises (multi-tenant)
-- Execute this script in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  logo_url text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  website text,
  description text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (user_id)
);

create index if not exists idx_company_members_company_id on public.company_members (company_id);
create index if not exists idx_company_members_user_id on public.company_members (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_companies_set_updated_at on public.companies;
create trigger trg_companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists trg_company_members_set_updated_at on public.company_members;
create trigger trg_company_members_set_updated_at
before update on public.company_members
for each row
execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.companies force row level security;
alter table public.company_members force row level security;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_company_owner(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role = 'owner'
  );
$$;

grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;
grant execute on function public.is_company_owner(uuid) to authenticated;

-- Atomic bootstrap flow: create company + owner membership for current auth user.
create or replace function public.bootstrap_company(p_company_name text)
returns table(company_id uuid, company_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_company_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if p_company_name is null or char_length(trim(p_company_name)) = 0 then
    raise exception 'COMPANY_NAME_REQUIRED';
  end if;

  if exists (
    select 1
    from public.company_members cm
    where cm.user_id = v_user_id
  ) then
    raise exception 'USER_ALREADY_IN_COMPANY';
  end if;

  insert into public.companies (name, created_by)
  values (trim(p_company_name), v_user_id)
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, v_user_id, 'owner');

  return query
  select c.id, c.name
  from public.companies c
  where c.id = v_company_id;
end;
$$;

grant execute on function public.bootstrap_company(text) to authenticated;

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member
on public.companies
for select
using (public.is_company_member(id));

drop policy if exists companies_insert_authenticated on public.companies;
create policy companies_insert_authenticated
on public.companies
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin
on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner
on public.companies
for delete
to authenticated
using (public.is_company_owner(id));

drop policy if exists company_members_select_same_company on public.company_members;
create policy company_members_select_same_company
on public.company_members
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists company_members_insert_admin on public.company_members;
create policy company_members_insert_admin
on public.company_members
for insert
to authenticated
with check (
  (
    role = 'owner'
    and user_id = auth.uid()
    and exists (
      select 1
      from public.companies c
      where c.id = company_id
        and c.created_by = auth.uid()
    )
  )
  or public.is_company_admin(company_id)
);

drop policy if exists company_members_update_admin on public.company_members;
create policy company_members_update_admin
on public.company_members
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists company_members_delete_owner on public.company_members;
create policy company_members_delete_owner
on public.company_members
for delete
to authenticated
using (public.is_company_owner(company_id));

commit;
