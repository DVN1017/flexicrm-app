-- FlexiCRM - Pipelines and dossiers V1
-- Run after 004_conversation_productivity.sql.

begin;

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pipeline_id, name),
  unique(pipeline_id, position)
);

create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  assigned_user_id uuid references auth.users(id) on delete set null,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','pending','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.dossier_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipelines_company on public.pipelines(company_id);
create index if not exists idx_pipeline_stages_company on public.pipeline_stages(company_id);
create index if not exists idx_pipeline_stages_pipeline_position on public.pipeline_stages(pipeline_id, position);
create index if not exists idx_dossiers_company_updated on public.dossiers(company_id, updated_at desc);
create index if not exists idx_dossiers_client on public.dossiers(client_id);
create index if not exists idx_dossiers_pipeline_stage on public.dossiers(pipeline_id, stage_id);
create index if not exists idx_dossiers_assigned on public.dossiers(assigned_user_id);
create index if not exists idx_dossiers_source_conversation on public.dossiers(source_conversation_id);
create index if not exists idx_dossier_notes_dossier_created on public.dossier_notes(dossier_id, created_at desc);

create or replace function public.pipeline_stage_company_matches()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.pipelines p
    where p.id = new.pipeline_id and p.company_id = new.company_id
  ) then
    raise exception 'PIPELINE_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pipeline_stage_company_matches on public.pipeline_stages;
create trigger trg_pipeline_stage_company_matches
before insert or update on public.pipeline_stages
for each row execute function public.pipeline_stage_company_matches();

create or replace function public.dossier_company_matches()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.clients c where c.id = new.client_id and c.company_id = new.company_id) then
    raise exception 'DOSSIER_CLIENT_COMPANY_MISMATCH';
  end if;
  if not exists (select 1 from public.pipelines p where p.id = new.pipeline_id and p.company_id = new.company_id) then
    raise exception 'DOSSIER_PIPELINE_COMPANY_MISMATCH';
  end if;
  if not exists (
    select 1 from public.pipeline_stages s
    where s.id = new.stage_id and s.pipeline_id = new.pipeline_id and s.company_id = new.company_id
  ) then
    raise exception 'DOSSIER_STAGE_COMPANY_MISMATCH';
  end if;
  if new.source_conversation_id is not null and not exists (
    select 1 from public.conversations c
    where c.id = new.source_conversation_id and c.company_id = new.company_id
  ) then
    raise exception 'DOSSIER_CONVERSATION_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_company_matches on public.dossiers;
create trigger trg_dossier_company_matches
before insert or update on public.dossiers
for each row execute function public.dossier_company_matches();

create or replace function public.dossier_note_company_matches()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.dossiers d
    where d.id = new.dossier_id and d.company_id = new.company_id
  ) then
    raise exception 'DOSSIER_NOTE_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_note_company_matches on public.dossier_notes;
create trigger trg_dossier_note_company_matches
before insert or update on public.dossier_notes
for each row execute function public.dossier_note_company_matches();

create or replace function public.set_dossier_closed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('completed', 'cancelled') and old.status is distinct from new.status then
    new.closed_at = coalesce(new.closed_at, now());
  elsif new.status not in ('completed', 'cancelled') then
    new.closed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossiers_closed_at on public.dossiers;
create trigger trg_dossiers_closed_at
before update on public.dossiers
for each row execute function public.set_dossier_closed_at();

create or replace function public.validate_dossier_assignee()
returns trigger
language plpgsql
as $$
begin
  if new.assigned_user_id is not null and not exists (
    select 1 from public.company_members cm
    where cm.company_id = new.company_id
      and cm.user_id = new.assigned_user_id
      and cm.status = 'active'
  ) then
    raise exception 'DOSSIER_ASSIGNEE_NOT_IN_COMPANY';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_assignee on public.dossiers;
create trigger trg_dossier_assignee
before insert or update on public.dossiers
for each row execute function public.validate_dossier_assignee();

create or replace function public.set_dossier_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pipelines_updated_at on public.pipelines;
create trigger trg_pipelines_updated_at before update on public.pipelines for each row execute function public.set_dossier_updated_at();
drop trigger if exists trg_pipeline_stages_updated_at on public.pipeline_stages;
create trigger trg_pipeline_stages_updated_at before update on public.pipeline_stages for each row execute function public.set_dossier_updated_at();
drop trigger if exists trg_dossiers_updated_at on public.dossiers;
create trigger trg_dossiers_updated_at before update on public.dossiers for each row execute function public.set_dossier_updated_at();
drop trigger if exists trg_dossier_notes_updated_at on public.dossier_notes;
create trigger trg_dossier_notes_updated_at before update on public.dossier_notes for each row execute function public.set_dossier_updated_at();

alter table public.pipelines enable row level security;
alter table public.pipelines force row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_stages force row level security;
alter table public.dossiers enable row level security;
alter table public.dossiers force row level security;
alter table public.dossier_notes enable row level security;
alter table public.dossier_notes force row level security;

revoke all on table public.pipelines, public.pipeline_stages, public.dossiers, public.dossier_notes from anon, authenticated;
grant select, insert, update, delete on public.pipelines, public.pipeline_stages, public.dossiers, public.dossier_notes to authenticated;

-- Pipeline configuration is administered by company admins.
drop policy if exists pipelines_select_member on public.pipelines;
create policy pipelines_select_member on public.pipelines for select to authenticated using (public.is_company_member(company_id));
drop policy if exists pipelines_insert_admin on public.pipelines;
create policy pipelines_insert_admin on public.pipelines for insert to authenticated with check (public.is_company_admin(company_id));
drop policy if exists pipelines_update_admin on public.pipelines;
create policy pipelines_update_admin on public.pipelines for update to authenticated using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
drop policy if exists pipelines_delete_admin on public.pipelines;
create policy pipelines_delete_admin on public.pipelines for delete to authenticated using (public.is_company_admin(company_id));

drop policy if exists pipeline_stages_select_member on public.pipeline_stages;
create policy pipeline_stages_select_member on public.pipeline_stages for select to authenticated using (public.is_company_member(company_id));
drop policy if exists pipeline_stages_insert_admin on public.pipeline_stages;
create policy pipeline_stages_insert_admin on public.pipeline_stages for insert to authenticated with check (public.is_company_admin(company_id));
drop policy if exists pipeline_stages_update_admin on public.pipeline_stages;
create policy pipeline_stages_update_admin on public.pipeline_stages for update to authenticated using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
drop policy if exists pipeline_stages_delete_admin on public.pipeline_stages;
create policy pipeline_stages_delete_admin on public.pipeline_stages for delete to authenticated using (public.is_company_admin(company_id));

-- Dossiers are visible and manageable by company members in V1.
drop policy if exists dossiers_select_member on public.dossiers;
create policy dossiers_select_member on public.dossiers for select to authenticated using (public.is_company_member(company_id));
drop policy if exists dossiers_insert_member on public.dossiers;
create policy dossiers_insert_member on public.dossiers for insert to authenticated with check (public.is_company_member(company_id));
drop policy if exists dossiers_update_member on public.dossiers;
create policy dossiers_update_member on public.dossiers for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
drop policy if exists dossiers_delete_admin on public.dossiers;
create policy dossiers_delete_admin on public.dossiers for delete to authenticated using (public.is_company_admin(company_id));

drop policy if exists dossier_notes_select_member on public.dossier_notes;
create policy dossier_notes_select_member on public.dossier_notes for select to authenticated using (public.is_company_member(company_id));
drop policy if exists dossier_notes_insert_member on public.dossier_notes;
create policy dossier_notes_insert_member on public.dossier_notes for insert to authenticated with check (public.is_company_member(company_id) and author_user_id = auth.uid());
drop policy if exists dossier_notes_update_author_admin on public.dossier_notes;
create policy dossier_notes_update_author_admin on public.dossier_notes for update to authenticated using (public.is_company_member(company_id) and (author_user_id = auth.uid() or public.is_company_admin(company_id))) with check (public.is_company_member(company_id) and (author_user_id = auth.uid() or public.is_company_admin(company_id)));
drop policy if exists dossier_notes_delete_author_admin on public.dossier_notes;
create policy dossier_notes_delete_author_admin on public.dossier_notes for delete to authenticated using (public.is_company_member(company_id) and (author_user_id = auth.uid() or public.is_company_admin(company_id)));

commit;
