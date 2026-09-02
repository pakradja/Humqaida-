create table if not exists public.curriculum_progress (
  learner_id uuid not null references public.learners(id) on delete cascade,
  page_number integer not null check (page_number between 2 and 33),
  segment_mode text not null check (segment_mode in ('quarter','half','full')),
  segment_index integer not null check (segment_index between 0 and 3),
  attempts integer not null default 0 check (attempts >= 0),
  best_rating integer not null default 0 check (best_rating between 0 and 3),
  completed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  primary key (learner_id,page_number,segment_mode,segment_index)
);

create index if not exists curriculum_progress_learner_activity_idx
  on public.curriculum_progress (learner_id,last_activity_at desc);

alter table public.curriculum_progress enable row level security;
grant select,insert,update on public.curriculum_progress to authenticated;

create policy family_curriculum_progress_select
on public.curriculum_progress for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id=learner_id
      and (l.parent_id=(select auth.uid()) or private.is_authorized_child(l.id))
  )
);

create policy family_curriculum_progress_insert
on public.curriculum_progress for insert to authenticated
with check (
  exists (
    select 1 from public.learners l
    where l.id=learner_id
      and (l.parent_id=(select auth.uid()) or private.is_authorized_child(l.id))
  )
);

create policy family_curriculum_progress_update
on public.curriculum_progress for update to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id=learner_id
      and (l.parent_id=(select auth.uid()) or private.is_authorized_child(l.id))
  )
)
with check (
  exists (
    select 1 from public.learners l
    where l.id=learner_id
      and (l.parent_id=(select auth.uid()) or private.is_authorized_child(l.id))
  )
);
