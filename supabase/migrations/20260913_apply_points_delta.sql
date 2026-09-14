-- apply_points_delta: race-free, server-side point application.
--
-- The client helper src/lib/points.js is NOT atomic: it inserts into
-- points_log and then updates profiles.points in two separate statements, so
-- a client crash between them leaves a log row without a matching balance
-- change (or vice versa). This RPC wraps both steps in a single transaction:
-- they either both commit or both roll back.
--
-- ⚠️ REVIEW BEFORE APPLYING ANYWHERE:
--   - Column types below follow how the app already writes points_log
--     (task_id / profile_id / points / note / entry_type). Confirm them
--     against your actual schema before running.
--   - This is SECURITY DEFINER, so it bypasses RLS — it must be locked down
--     before launch. Recommended hardening (uncomment after setting the
--     in-function role check to your liking):
--
--     revoke execute on function public.apply_points_delta from anon, authenticated;
--     grant execute on function public.apply_points_delta to authenticated;
--
--   - Only excom/admin should be able to adjust points. Add an in-function
--     guard (rather than relying on RLS, which this bypasses), e.g.:
--
--     if not exists (
--       select 1 from public.profiles
--       where id = auth.uid() and role in ('excom', 'admin')
--     ) then raise exception 'not authorized'; end if;

create or replace function public.apply_points_delta(
  p_profile_id uuid,
  p_points integer,          -- signed delta: positive = award, negative = deduction
  p_note text,
  p_entry_type text default 'adjustment',
  p_task_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.points_log (task_id, profile_id, points, note, entry_type)
  values (p_task_id, p_profile_id, p_points, p_note, p_entry_type);

  update public.profiles
  set points = points + p_points
  where id = p_profile_id;
end;
$$;