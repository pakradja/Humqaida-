-- Humza's Qaida Quest: cloud progress, parent ownership, child device access.
create extension if not exists pgcrypto;

create table public.parent_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.learners (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_profiles(user_id) on delete cascade,
  display_name text not null default 'Humza' check (char_length(display_name) between 1 and 40),
  avatar text not null default '⚽', current_lesson integer not null default 0 check (current_lesson >= 0),
  daily_goal integer not null default 10 check (daily_goal between 5 and 60),
  created_at timestamptz not null default now()
);
create table public.authorized_devices (
  id uuid primary key default gen_random_uuid(), learner_id uuid not null references public.learners(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete cascade, friendly_name text not null default 'Humza device',
  pairing_code_hash text, pairing_expires_at timestamptz, authorized_at timestamptz, last_active_at timestamptz,
  revoked_at timestamptz, created_at timestamptz not null default now()
);
create unique index one_open_pairing_per_learner on public.authorized_devices(learner_id) where auth_user_id is null and revoked_at is null;
create table public.lesson_progress (
  learner_id uuid not null references public.learners(id) on delete cascade, lesson_id text not null,
  status text not null default 'unlocked' check(status in ('locked','unlocked','complete')),
  best_accuracy numeric(5,2) not null default 0 check(best_accuracy between 0 and 100), attempts integer not null default 0,
  completed_at timestamptz, last_activity_at timestamptz not null default now(), primary key(learner_id,lesson_id)
);
create table public.learning_sessions (
  id uuid primary key, learner_id uuid not null references public.learners(id) on delete cascade,
  session_type text not null check(session_type in ('lesson','practice','game','review')), activity_id text not null,
  started_at timestamptz not null, ended_at timestamptz not null, active_seconds integer not null check(active_seconds between 0 and 7200),
  correct_answers integer not null check(correct_answers >= 0), total_answers integer not null check(total_answers > 0),
  xp_earned integer not null default 0 check(xp_earned between 0 and 500), coins_earned integer not null default 0 check(coins_earned between 0 and 200),
  created_at timestamptz not null default now()
);
create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.learning_sessions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade, activity_type text not null, concept_id text not null,
  question text not null, correct_answer text not null, selected_answer text not null, is_correct boolean not null,
  attempted_at timestamptz not null default now()
);
create table public.concept_mastery (
  learner_id uuid not null references public.learners(id) on delete cascade, concept_id text not null,
  correct_count integer not null default 0, incorrect_count integer not null default 0,
  mastery_score numeric(5,2) not null default 0 check(mastery_score between 0 and 100), review_priority numeric(7,2) not null default 0,
  last_reviewed_at timestamptz, primary key(learner_id,concept_id)
);
create table public.rewards (
  learner_id uuid not null references public.learners(id) on delete cascade, reward_id text not null,
  coin_cost integer not null check(coin_cost >= 0), purchased_at timestamptz not null default now(), equipped boolean not null default false,
  primary key(learner_id,reward_id)
);
create table public.learner_totals (
  learner_id uuid primary key references public.learners(id) on delete cascade, xp integer not null default 0,
  coins integer not null default 30 check(coins >= 0), level integer not null default 1, current_streak integer not null default 0,
  longest_streak integer not null default 0, total_lessons integer not null default 0, total_sessions integer not null default 0,
  total_learning_seconds integer not null default 0, last_active_at timestamptz, last_streak_date date, updated_at timestamptz not null default now()
);

create table public.audio_items (
  id text primary key check (id ~ '^letter_[a-z_]+$'), arabic text not null, display_name text not null,
  content_type text not null default 'letter_name' check(content_type in ('letter_name','short_vowel','word','teacher_prompt')),
  created_at timestamptz not null default now()
);
create table public.audio_recordings (
  id uuid primary key default gen_random_uuid(), learner_id uuid not null references public.learners(id) on delete cascade,
  item_id text not null references public.audio_items(id), storage_path text not null unique,
  version integer not null default 1 check(version > 0), status text not null default 'draft' check(status in ('draft','in_review','approved','rejected')),
  source_kind text not null check(source_kind in ('teacher_recording','licensed_derivative')),
  speaker_name text not null check(char_length(speaker_name) between 1 and 120), reviewer_name text,
  permission_confirmed boolean not null default false, mime_type text not null,
  source_url text, source_license text, source_attribution text, source_sha256 text,
  notes text, reviewed_at timestamptz, created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  unique(learner_id,item_id,version),
  check(status <> 'approved' or (permission_confirmed and reviewer_name is not null and reviewed_at is not null))
);
create unique index one_approved_audio_per_item on public.audio_recordings(learner_id,item_id) where status='approved';
create or replace function public.assign_audio_version() returns trigger language plpgsql set search_path='' as $$
begin
  select coalesce(max(version),0)+1 into new.version from public.audio_recordings where learner_id=new.learner_id and item_id=new.item_id;
  return new;
end $$;
create trigger audio_recording_version before insert on public.audio_recordings for each row execute function public.assign_audio_version();

insert into public.audio_items(id,arabic,display_name) values
('letter_alif','ا','Alif'),('letter_ba','ب','Bā'),('letter_ta','ت','Tā'),('letter_tha','ث','Thā'),('letter_jim','ج','Jīm'),
('letter_ha_emphatic','ح','Ḥā'),('letter_kha','خ','Khā'),('letter_dal','د','Dāl'),('letter_dhal','ذ','Dhāl'),('letter_ra','ر','Rā'),
('letter_zay','ز','Zā'),('letter_sin','س','Sīn'),('letter_shin','ش','Shīn'),('letter_sad','ص','Ṣād'),('letter_dad','ض','Ḍād'),
('letter_ta_emphatic','ط','Ṭā'),('letter_za_emphatic','ظ','Ẓā'),('letter_ayn','ع','ʿAyn'),('letter_ghayn','غ','Ghayn'),('letter_fa','ف','Fā'),
('letter_qaf','ق','Qāf'),('letter_kaf','ك','Kāf'),('letter_lam','ل','Lām'),('letter_mim','م','Mīm'),('letter_nun','ن','Nūn'),
('letter_ha','ه','Hā'),('letter_waw','و','Wāw'),('letter_ya','ي','Yā');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('qaida-audio','qaida-audio',false,10485760,array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.create_family(p_display_name text default 'Parent', p_learner_name text default 'Humza') returns uuid
language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'permanent parent account required'; end if;
  insert into public.parent_profiles(user_id,display_name) values(auth.uid(),left(p_display_name,80)) on conflict(user_id) do nothing;
  select id into v_id from public.learners where parent_id=auth.uid() order by created_at limit 1;
  if v_id is null then insert into public.learners(parent_id,display_name) values(auth.uid(),left(p_learner_name,40)) returning id into v_id; insert into public.learner_totals(learner_id) values(v_id); end if;
  return v_id;
end $$;
create or replace function public.create_pairing_code(p_learner_id uuid, p_device_name text default 'Humza iPad') returns text
language plpgsql security definer set search_path='' as $$
declare v_code text := lpad((floor(random()*1000000))::int::text,6,'0');
begin
  if auth.uid() is null or not exists(select 1 from public.learners where id=p_learner_id and parent_id=auth.uid()) then raise exception 'not authorized'; end if;
  delete from public.authorized_devices where learner_id=p_learner_id and auth_user_id is null;
  insert into public.authorized_devices(learner_id,friendly_name,pairing_code_hash,pairing_expires_at) values(p_learner_id,left(p_device_name,80),crypt(v_code,gen_salt('bf')),now()+interval '15 minutes');
  return v_code;
end $$;
create or replace function public.claim_child_device(p_code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_learner uuid;
begin
  if auth.uid() is null or not coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'anonymous child session required'; end if;
  update public.authorized_devices set auth_user_id=auth.uid(),authorized_at=now(),last_active_at=now(),pairing_code_hash=null,pairing_expires_at=null
  where id=(select id from public.authorized_devices where pairing_expires_at>now() and revoked_at is null and crypt(p_code,pairing_code_hash)=pairing_code_hash limit 1)
  returning learner_id into v_learner;
  if v_learner is null then raise exception 'invalid or expired code'; end if; return v_learner;
end $$;
create or replace function public.record_learning_session(p_id uuid,p_learner_id uuid,p_type text,p_activity text,p_started timestamptz,p_ended timestamptz,p_seconds integer,p_correct integer,p_total integer,p_xp integer,p_coins integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_rows integer := 0; v_totals public.learner_totals;
begin
  if auth.uid() is null or not (exists(select 1 from public.learners where id=p_learner_id and parent_id=auth.uid()) or exists(select 1 from public.authorized_devices where learner_id=p_learner_id and auth_user_id=auth.uid() and revoked_at is null)) then raise exception 'not authorized'; end if;
  insert into public.learning_sessions(id,learner_id,session_type,activity_id,started_at,ended_at,active_seconds,correct_answers,total_answers,xp_earned,coins_earned)
  values(p_id,p_learner_id,p_type,p_activity,p_started,p_ended,least(greatest(p_seconds,0),7200),p_correct,p_total,least(greatest(p_xp,0),500),least(greatest(p_coins,0),200)) on conflict(id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    update public.learner_totals set xp=xp+p_xp,coins=coins+p_coins,level=1+((xp+p_xp)/100),total_sessions=total_sessions+1,
      total_learning_seconds=total_learning_seconds+p_seconds,last_active_at=now(),updated_at=now(),
      current_streak=case when last_streak_date=current_date then current_streak when last_streak_date=current_date-1 then current_streak+1 else 1 end,
      longest_streak=greatest(longest_streak,case when last_streak_date=current_date then current_streak when last_streak_date=current_date-1 then current_streak+1 else 1 end),last_streak_date=current_date
    where learner_id=p_learner_id returning * into v_totals;
    if p_type='lesson' then
      insert into public.lesson_progress(learner_id,lesson_id,status,best_accuracy,attempts,completed_at,last_activity_at)
      values(p_learner_id,p_activity,'complete',(p_correct::numeric/p_total)*100,1,now(),now())
      on conflict(learner_id,lesson_id) do update set status='complete',best_accuracy=greatest(public.lesson_progress.best_accuracy,excluded.best_accuracy),attempts=public.lesson_progress.attempts+1,completed_at=coalesce(public.lesson_progress.completed_at,now()),last_activity_at=now();
      update public.learners set current_lesson=greatest(current_lesson,coalesce(nullif(regexp_replace(p_activity,'\D','','g'),''),'0')::integer+1) where id=p_learner_id;
      update public.learner_totals set total_lessons=(select count(*) from public.lesson_progress where learner_id=p_learner_id and status='complete') where learner_id=p_learner_id;
    end if;
  else select * into v_totals from public.learner_totals where learner_id=p_learner_id; end if;
  return jsonb_build_object('inserted',v_rows > 0,'xp',v_totals.xp,'coins',v_totals.coins,'level',v_totals.level);
end $$;
create or replace function public.purchase_reward(p_learner_id uuid,p_reward_id text,p_cost integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_coins integer;
begin
  if auth.uid() is null or not (exists(select 1 from public.learners where id=p_learner_id and parent_id=auth.uid()) or exists(select 1 from public.authorized_devices where learner_id=p_learner_id and auth_user_id=auth.uid() and revoked_at is null)) then raise exception 'not authorized'; end if;
  if p_cost < 0 or p_cost > 1000 then raise exception 'invalid price'; end if;
  if exists(select 1 from public.rewards where learner_id=p_learner_id and reward_id=p_reward_id) then select coins into v_coins from public.learner_totals where learner_id=p_learner_id; return jsonb_build_object('purchased',false,'coins',v_coins); end if;
  update public.learner_totals set coins=coins-p_cost,updated_at=now() where learner_id=p_learner_id and coins>=p_cost returning coins into v_coins;
  if v_coins is null then raise exception 'not enough coins'; end if;
  insert into public.rewards(learner_id,reward_id,coin_cost) values(p_learner_id,p_reward_id,p_cost);
  return jsonb_build_object('purchased',true,'coins',v_coins);
end $$;

revoke all on all tables in schema public from anon,authenticated;
grant select,insert,update,delete on public.parent_profiles,public.learners,public.authorized_devices,public.lesson_progress,public.learning_sessions,public.practice_attempts,public.concept_mastery,public.rewards,public.learner_totals to authenticated;
grant select on public.audio_items to authenticated;
grant select,insert,update on public.audio_recordings to authenticated;
alter table public.parent_profiles enable row level security; alter table public.learners enable row level security; alter table public.authorized_devices enable row level security;
alter table public.lesson_progress enable row level security; alter table public.learning_sessions enable row level security; alter table public.practice_attempts enable row level security;
alter table public.concept_mastery enable row level security; alter table public.rewards enable row level security; alter table public.learner_totals enable row level security;
alter table public.audio_items enable row level security; alter table public.audio_recordings enable row level security;
create policy authenticated_audio_catalog_select on public.audio_items for select to authenticated using(true);
create policy family_audio_select on public.audio_recordings for select to authenticated using(
  exists(select 1 from public.learners l where l.id=learner_id and (l.parent_id=(select auth.uid()) or
    (status='approved' and exists(select 1 from public.authorized_devices d where d.learner_id=l.id and d.auth_user_id=(select auth.uid()) and d.revoked_at is null))))
);
create policy parent_audio_insert on public.audio_recordings for insert to authenticated with check(
  created_by=(select auth.uid()) and permission_confirmed and exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid()))
  and storage_path like learner_id::text||'/'||item_id||'/%'
);
create policy parent_audio_update on public.audio_recordings for update to authenticated using(
  exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid()))
) with check(
  exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid()))
  and storage_path like learner_id::text||'/'||item_id||'/%'
);

create policy parent_audio_object_insert on storage.objects for insert to authenticated with check(
  bucket_id='qaida-audio' and exists(select 1 from public.learners l where l.id::text=(storage.foldername(name))[1] and l.parent_id=(select auth.uid()))
);
create policy family_audio_object_select on storage.objects for select to authenticated using(
  bucket_id='qaida-audio' and exists(select 1 from public.audio_recordings r join public.learners l on l.id=r.learner_id where r.storage_path=name and
    (l.parent_id=(select auth.uid()) or (r.status='approved' and exists(select 1 from public.authorized_devices d where d.learner_id=l.id and d.auth_user_id=(select auth.uid()) and d.revoked_at is null))))
);
create policy parent_audio_object_update on storage.objects for update to authenticated using(
  bucket_id='qaida-audio' and exists(select 1 from public.learners l where l.id::text=(storage.foldername(name))[1] and l.parent_id=(select auth.uid()))
) with check(
  bucket_id='qaida-audio' and exists(select 1 from public.learners l where l.id::text=(storage.foldername(name))[1] and l.parent_id=(select auth.uid()))
);
create policy parent_own_profile_select on public.parent_profiles for select to authenticated using((select auth.uid())=user_id);
create policy parent_own_profile_update on public.parent_profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy family_learner_select on public.learners for select to authenticated using(parent_id=(select auth.uid()) or exists(select 1 from public.authorized_devices d where d.learner_id=id and d.auth_user_id=(select auth.uid()) and d.revoked_at is null));
create policy parent_learner_update on public.learners for update to authenticated using(parent_id=(select auth.uid())) with check(parent_id=(select auth.uid()));
create policy family_device_select on public.authorized_devices for select to authenticated using(auth_user_id=(select auth.uid()) or exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid())));
create policy parent_device_update on public.authorized_devices for update to authenticated using(exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid()))) with check(exists(select 1 from public.learners l where l.id=learner_id and l.parent_id=(select auth.uid())));
do $$ declare t text; begin foreach t in array array['lesson_progress','learning_sessions','practice_attempts','concept_mastery','rewards','learner_totals'] loop execute format('create policy family_%1$s_select on public.%1$I for select to authenticated using(exists(select 1 from public.learners l where l.id=learner_id and (l.parent_id=(select auth.uid()) or exists(select 1 from public.authorized_devices d where d.learner_id=l.id and d.auth_user_id=(select auth.uid()) and d.revoked_at is null))))',t); end loop; end $$;
grant execute on function public.create_family(text,text),public.create_pairing_code(uuid,text),public.claim_child_device(text),public.record_learning_session(uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,integer,integer,integer) to authenticated;
grant execute on function public.purchase_reward(uuid,text,integer) to authenticated;
revoke execute on function public.create_family(text,text),public.create_pairing_code(uuid,text),public.claim_child_device(text),public.record_learning_session(uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,integer,integer,integer) from public,anon;
revoke execute on function public.purchase_reward(uuid,text,integer) from public,anon;
