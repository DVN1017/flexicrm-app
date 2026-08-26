-- FlexiCRM - Conversation productivity (private notes + safer WhatsApp reads)
-- Run after 003_conversations.sql.

begin;

create table if not exists public.conversation_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversation_notes_conversation_created
  on public.conversation_notes(conversation_id, created_at desc);
create index if not exists idx_conversation_notes_company
  on public.conversation_notes(company_id);

create or replace function public.conversation_note_company_matches()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.conversations c
    where c.id = new.conversation_id and c.company_id = new.company_id
  ) then
    raise exception 'NOTE_CONVERSATION_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_conversation_note_company_matches on public.conversation_notes;
create trigger trg_conversation_note_company_matches
before insert or update on public.conversation_notes
for each row execute function public.conversation_note_company_matches();

drop trigger if exists trg_conversation_notes_updated_at on public.conversation_notes;
create trigger trg_conversation_notes_updated_at
before update on public.conversation_notes
for each row execute function public.set_updated_at();

alter table public.conversation_notes enable row level security;
alter table public.conversation_notes force row level security;

drop policy if exists conversation_notes_select_member on public.conversation_notes;
create policy conversation_notes_select_member
on public.conversation_notes for select to authenticated
using (public.is_company_member(company_id));

drop policy if exists conversation_notes_insert_member on public.conversation_notes;
create policy conversation_notes_insert_member
on public.conversation_notes for insert to authenticated
with check (
  public.is_company_member(company_id)
  and author_user_id = auth.uid()
);

drop policy if exists conversation_notes_update_author_or_admin on public.conversation_notes;
create policy conversation_notes_update_author_or_admin
on public.conversation_notes for update to authenticated
using (
  public.is_company_member(company_id)
  and (author_user_id = auth.uid() or public.is_company_admin(company_id))
)
with check (
  public.is_company_member(company_id)
  and (author_user_id = auth.uid() or public.is_company_admin(company_id))
);

drop policy if exists conversation_notes_delete_author_or_admin on public.conversation_notes;
create policy conversation_notes_delete_author_or_admin
on public.conversation_notes for delete to authenticated
using (
  public.is_company_member(company_id)
  and (author_user_id = auth.uid() or public.is_company_admin(company_id))
);

-- Access tokens must never be exposed to browser-side authenticated queries.
-- Server-side service-role operations continue to work normally.
revoke select on table public.whatsapp_accounts from authenticated, anon;

drop view if exists public.whatsapp_accounts_safe;
create view public.whatsapp_accounts_safe
as
select
  id,
  company_id,
  business_account_id,
  waba_id,
  phone_number_id,
  display_phone_number,
  status,
  created_at,
  updated_at
from public.whatsapp_accounts
where public.is_company_member(company_id);

grant select on public.whatsapp_accounts_safe to authenticated;

grant select on public.conversation_notes to authenticated;
grant insert on public.conversation_notes to authenticated;
grant update on public.conversation_notes to authenticated;
grant delete on public.conversation_notes to authenticated;

commit;
