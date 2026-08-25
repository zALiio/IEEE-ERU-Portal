-- Add the two new statuses to the existing task_status enum.
-- Members now stop at 'submitted'; Leaders/Excom/Admin move it to 'confirmed'.
alter type task_status add value if not exists 'submitted';
alter type task_status add value if not exists 'confirmed';

-- Atomic confirm function: checks the caller is allowed to confirm this task,
-- flips the status, logs the points, and updates the member's total —
-- all in one transaction so it can never go out of sync partway through.
create or replace function confirm_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task tasks%rowtype;
  v_caller_role text;
  v_caller_id uuid := auth.uid();
  v_assignee_team uuid;
  v_caller_leads_team boolean;
begin
  select role into v_caller_role from profiles where id = v_caller_id;

  if v_caller_role not in ('leader', 'excom', 'admin') then
    raise exception 'Not authorized to confirm tasks';
  end if;

  select * into v_task from tasks where id = p_task_id;
  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.status <> 'submitted' then
    raise exception 'Task is not awaiting confirmation';
  end if;

  -- Leaders can only confirm tasks for members on a team they lead.
  if v_caller_role = 'leader' then
    select team_id into v_assignee_team from profiles where id = v_task.assigned_to;
    select exists (
      select 1 from team_leads
      where profile_id = v_caller_id and team_id = v_assignee_team
    ) into v_caller_leads_team;

    if not v_caller_leads_team then
      raise exception 'Not authorized to confirm tasks for this member';
    end if;
  end if;

  update tasks set status = 'confirmed' where id = p_task_id;

  insert into points_log (task_id, profile_id, points, note, entry_type)
  values (p_task_id, v_task.assigned_to, v_task.points, v_task.title, 'task');

  update profiles set points = points + v_task.points where id = v_task.assigned_to;
end;
$$;

-- Members can only ever move a task to 'submitted' themselves, never further.
-- (Confirming happens only through confirm_task above, which runs as the
-- function owner and bypasses this restriction safely.)
drop policy if exists "tasks_update_own" on tasks;
create policy "tasks_update_own"
  on tasks for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid() and status in ('todo', 'in_progress', 'submitted'));
