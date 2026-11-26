-- Retire the former automated payment system. Historical tables remain for audit/migration history only.
-- No API role, including service_role, may read or mutate payment records or finalize transfers.
begin;

revoke all on table public.payment_orders from public, anon, authenticated, service_role;
revoke all on table public.payment_transactions from public, anon, authenticated, service_role;
revoke all on table public.payment_review_events from public, anon, authenticated, service_role;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated, service_role;

commit;
