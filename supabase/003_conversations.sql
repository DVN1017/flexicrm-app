-- FlexiCRM - Conversations / WhatsApp core
-- Run after 001_companies.sql and 002_company_invitations.sql.

begin;

create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  business_account_id text,
  waba_id text,
  phone_number_id text not null,
  display_phone_number text,
  access_token text not null,
  status text not null default 'active' check (status in ('active','disconnected','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, phone_number_id),
  unique(phone_number_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'WhatsApp contact',
  phone text not null,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, phone)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  whatsapp_account_id uuid not null references public.whatsapp_accounts(id) on delete restrict,
  assigned_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','pending','closed')),
  subject text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('client','employee','ai','system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text' check (message_type in ('text','image','document','audio','video','sticker','location','contact')),
  body text,
  external_message_id text,
  status text not null default 'received' check (status in ('received','queued','sent','delivered','read','failed')),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(company_id, external_message_id)
);

create index if not exists idx_whatsapp_accounts_company on public.whatsapp_accounts(company_id);
create index if not exists idx_whatsapp_accounts_phone_number on public.whatsapp_accounts(phone_number_id);
create index if not exists idx_clients_company on public.clients(company_id);
create index if not exists idx_conversations_company_updated on public.conversations(company_id, updated_at desc);
create index if not exists idx_conversations_client on public.conversations(client_id);
create index if not exists idx_conversations_assigned on public.conversations(assigned_user_id);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at asc);
create index if not exists idx_messages_company_created on public.messages(company_id, created_at desc);

create or replace function public.conversation_company_matches()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.clients c where c.id = new.client_id and c.company_id = new.company_id) then raise exception 'CLIENT_COMPANY_MISMATCH'; end if;
  if not exists (select 1 from public.whatsapp_accounts w where w.id = new.whatsapp_account_id and w.company_id = new.company_id) then raise exception 'WHATSAPP_ACCOUNT_COMPANY_MISMATCH'; end if;
  return new;
end;
$$;

drop trigger if exists trg_conversation_company_matches on public.conversations;
create trigger trg_conversation_company_matches before insert or update on public.conversations for each row execute function public.conversation_company_matches();

create or replace function public.message_company_matches()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.conversations c where c.id = new.conversation_id and c.company_id = new.company_id) then raise exception 'MESSAGE_COMPANY_MISMATCH'; end if;
  return new;
end;
$$;

drop trigger if exists trg_message_company_matches on public.messages;
create trigger trg_message_company_matches before insert or update on public.messages for each row execute function public.message_company_matches();

drop trigger if exists trg_whatsapp_accounts_updated_at on public.whatsapp_accounts;
create trigger trg_whatsapp_accounts_updated_at before update on public.whatsapp_accounts for each row execute function public.set_updated_at();
drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();

alter table public.whatsapp_accounts enable row level security;
alter table public.clients enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.whatsapp_accounts force row level security;
alter table public.clients force row level security;
alter table public.conversations force row level security;
alter table public.messages force row level security;

-- Credentials must never be readable by browser sessions. Server operations use service role.
drop policy if exists whatsapp_accounts_select_member on public.whatsapp_accounts;
drop policy if exists whatsapp_accounts_insert_admin on public.whatsapp_accounts;
create policy whatsapp_accounts_insert_admin on public.whatsapp_accounts for insert to authenticated with check (public.is_company_admin(company_id));
drop policy if exists whatsapp_accounts_update_admin on public.whatsapp_accounts;
create policy whatsapp_accounts_update_admin on public.whatsapp_accounts for update to authenticated using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));
drop policy if exists whatsapp_accounts_delete_admin on public.whatsapp_accounts;
create policy whatsapp_accounts_delete_admin on public.whatsapp_accounts for delete to authenticated using (public.is_company_admin(company_id));

-- Every business table is tenant-scoped.
drop policy if exists clients_select_member on public.clients;
create policy clients_select_member on public.clients for select to authenticated using (public.is_company_member(company_id));
drop policy if exists clients_insert_member on public.clients;
create policy clients_insert_member on public.clients for insert to authenticated with check (public.is_company_member(company_id));
drop policy if exists clients_update_member on public.clients;
create policy clients_update_member on public.clients for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
drop policy if exists clients_delete_admin on public.clients;
create policy clients_delete_admin on public.clients for delete to authenticated using (public.is_company_admin(company_id));

drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations for select to authenticated using (public.is_company_member(company_id));
drop policy if exists conversations_insert_member on public.conversations;
create policy conversations_insert_member on public.conversations for insert to authenticated with check (public.is_company_member(company_id));
drop policy if exists conversations_update_member on public.conversations;
create policy conversations_update_member on public.conversations for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
drop policy if exists conversations_delete_admin on public.conversations;
create policy conversations_delete_admin on public.conversations for delete to authenticated using (public.is_company_admin(company_id));

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated using (public.is_company_member(company_id));
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated with check (public.is_company_member(company_id));
drop policy if exists messages_update_member on public.messages;
create policy messages_update_member on public.messages for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
drop policy if exists messages_delete_admin on public.messages;
create policy messages_delete_admin on public.messages for delete to authenticated using (public.is_company_admin(company_id));

-- Regression tests: these fail loudly if RLS is not enabled/forced.
do $$
begin
  if not exists (select 1 from pg_class where oid = 'public.whatsapp_accounts'::regclass and relrowsecurity and relforcerowsecurity) then raise exception 'RLS_WHATSAPP_ACCOUNTS_NOT_STRICT'; end if;
  if not exists (select 1 from pg_class where oid = 'public.clients'::regclass and relrowsecurity and relforcerowsecurity) then raise exception 'RLS_CLIENTS_NOT_STRICT'; end if;
  if not exists (select 1 from pg_class where oid = 'public.conversations'::regclass and relrowsecurity and relforcerowsecurity) then raise exception 'RLS_CONVERSATIONS_NOT_STRICT'; end if;
  if not exists (select 1 from pg_class where oid = 'public.messages'::regclass and relrowsecurity and relforcerowsecurity) then raise exception 'RLS_MESSAGES_NOT_STRICT'; end if;
end;
$$;

commit;
