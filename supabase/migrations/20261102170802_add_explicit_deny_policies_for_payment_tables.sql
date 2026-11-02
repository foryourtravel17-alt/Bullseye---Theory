create policy "Deny browser access to payment orders" on public.payment_orders
as restrictive for all to anon, authenticated using (false) with check (false);
create policy "Deny browser access to payment transactions" on public.payment_transactions
as restrictive for all to anon, authenticated using (false) with check (false);
create policy "Deny browser access to payment review events" on public.payment_review_events
as restrictive for all to anon, authenticated using (false) with check (false);
