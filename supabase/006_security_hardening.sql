-- FlexiCRM - Security hardening
-- Run after 005_pipelines_dossiers.sql.
-- Protect safe WhatsApp account metadata without exposing access_token.

begin;

-- The browser may read only non-secret WhatsApp account columns.
-- Row access remains tenant-scoped by RLS.
drop policy if exists whatsapp_accounts_select_member on public.whatsapp_accounts;
create policy whatsapp_accounts_select_member
on public.whatsapp_accounts
for select
to authenticated
using (public.is_company_member(company_id));

revoke all on table public.whatsapp_accounts from public, anon, authenticated;
grant select (
  id,
  company_id,
  business_account_id,
  waba_id,
  phone_number_id,
  display_phone_number,
  status,
  created_at,
  updated_at
) on public.whatsapp_accounts to authenticated;

-- security_invoker makes the view obey the caller's table privileges and RLS.
drop view if exists public.whatsapp_accounts_safe;
create view public.whatsapp_accounts_safe
with (security_invoker = true)
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

revoke all on public.whatsapp_accounts_safe from public, anon, authenticated;
grant select on public.whatsapp_accounts_safe to authenticated;

-- This maintenance function updates every expired invitation. It must not be
-- callable by ordinary authenticated users as an arbitrary global operation.
revoke all on function public.expire_stale_company_invitations() from public, anon, authenticated;
grant execute on function public.expire_stale_company_invitations() to service_role;

commit;
