-- Break the learners <-> authorized_devices RLS recursion with a private,
-- ownership-scoped lookup. The helper is not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_authorized_child(p_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.authorized_devices d
    where d.learner_id = p_learner_id
      and d.auth_user_id = (select auth.uid())
      and d.revoked_at is null
  )
$$;

revoke all on function private.is_authorized_child(uuid) from public, anon;
grant execute on function private.is_authorized_child(uuid) to authenticated;

drop policy if exists family_learner_select on public.learners;
create policy family_learner_select
on public.learners
for select
to authenticated
using (
  parent_id = (select auth.uid())
  or private.is_authorized_child(id)
);
