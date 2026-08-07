-- Authentication creates a minimal public profile first. A nickname and the
-- required consent records are completed in a separate onboarding step.
create table if not exists public.account_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  age_14_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_completed_onboarding(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and exists (
    select 1 from public.account_consents where user_id = p_user_id
  );
$$;

revoke all on function public.has_completed_onboarding(uuid) from public;
grant execute on function public.has_completed_onboarding(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatar images public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_completed_onboarding(auth.uid())
  );

create policy "users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_completed_onboarding(auth.uid())
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_completed_onboarding(auth.uid())
  );

create policy "users delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_completed_onboarding(auth.uid())
  );

alter table public.account_consents enable row level security;

create policy "own consents readable"
  on public.account_consents for select
  using (user_id = auth.uid());

create policy "own consents create"
  on public.account_consents for insert
  with check (user_id = auth.uid());

create policy "own consents update"
  on public.account_consents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nickname)
  values (new.id, '새 회원')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Ensure users created before this migration also have the required profile row.
insert into public.profiles (user_id, nickname)
select users.id, '새 회원'
from auth.users as users
on conflict (user_id) do nothing;

create or replace function public.complete_onboarding(
  p_nickname text,
  p_terms_version text,
  p_privacy_version text,
  p_age_confirmed boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result public.profiles;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_nickname, ''))) not between 2 and 30 then
    raise exception '닉네임은 2자 이상 30자 이하로 입력해 주세요.' using errcode = '22023';
  end if;

  if not coalesce(p_age_confirmed, false) then
    raise exception '만 14세 이상 확인이 필요합니다.' using errcode = '22023';
  end if;

  if btrim(coalesce(p_terms_version, '')) = ''
    or btrim(coalesce(p_privacy_version, '')) = '' then
    raise exception '필수 약관 동의가 필요합니다.' using errcode = '22023';
  end if;

  insert into public.profiles (user_id, nickname)
  values (current_user_id, btrim(p_nickname))
  on conflict (user_id) do update
    set nickname = excluded.nickname,
        updated_at = now()
  returning * into result;

  insert into public.account_consents (
    user_id,
    terms_version,
    privacy_version,
    terms_accepted_at,
    privacy_accepted_at,
    age_14_confirmed_at
  ) values (
    current_user_id,
    p_terms_version,
    p_privacy_version,
    now(),
    now(),
    now()
  )
  on conflict (user_id) do update set
    terms_version = excluded.terms_version,
    privacy_version = excluded.privacy_version,
    terms_accepted_at = case
      when public.account_consents.terms_version is distinct from excluded.terms_version
        then excluded.terms_accepted_at
      else public.account_consents.terms_accepted_at
    end,
    privacy_accepted_at = case
      when public.account_consents.privacy_version is distinct from excluded.privacy_version
        then excluded.privacy_accepted_at
      else public.account_consents.privacy_accepted_at
    end,
    age_14_confirmed_at = public.account_consents.age_14_confirmed_at,
    updated_at = now();

  return result;
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, boolean) from public;
grant execute on function public.complete_onboarding(text, text, text, boolean) to authenticated;

revoke all on function public.handle_new_auth_user() from public;

create or replace function public.set_profile_avatar(p_avatar_path text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result public.profiles;
begin
  if current_user_id is null or not public.has_completed_onboarding(current_user_id) then
    raise exception '가입 완료 후 프로필 사진을 설정할 수 있습니다.' using errcode = '42501';
  end if;

  if p_avatar_path is distinct from (current_user_id::text || '/avatar') then
    raise exception '올바르지 않은 프로필 사진 경로입니다.' using errcode = '22023';
  end if;

  update public.profiles
  set avatar_path = p_avatar_path,
      updated_at = now()
  where user_id = current_user_id
  returning * into result;

  if result.user_id is null then
    raise exception '프로필을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

revoke all on function public.set_profile_avatar(text) from public;
grant execute on function public.set_profile_avatar(text) to authenticated;

-- A verified Auth session is not enough to publish content. Until onboarding
-- has recorded the required consents, the placeholder profile stays private
-- and every user-authored write policy remains closed.
drop policy if exists "public profiles readable" on public.profiles;
create policy "public profiles readable" on public.profiles for select using (
  (
    public.has_completed_onboarding(user_id)
    and suspended_at is null
  )
  or user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
using (
  user_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
)
with check (
  user_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and is_admin = public.is_admin()
);

drop policy if exists "expert application create" on public.expert_profiles;
create policy "expert application create" on public.expert_profiles for insert with check (
  user_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and verification_status in ('NONE','PENDING')
  and repair_enabled = false
);

drop policy if exists "experts manage own skills" on public.expert_skills;
create policy "experts manage own skills" on public.expert_skills for all
using (expert_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
with check (expert_id = auth.uid() and public.has_completed_onboarding(auth.uid()));

drop policy if exists "experts manage own subscriptions" on public.expert_subscriptions;
create policy "experts manage own subscriptions" on public.expert_subscriptions for all
using (expert_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
with check (expert_id = auth.uid() and public.has_completed_onboarding(auth.uid()));

drop policy if exists "temporary owner create" on public.temporary_models;
create policy "temporary owner create" on public.temporary_models for insert with check (
  submitted_by = auth.uid()
  and status = 'PENDING'
  and public.has_completed_onboarding(auth.uid())
);

drop policy if exists "authenticated create case" on public.cases;
create policy "authenticated create case" on public.cases for insert with check (
  author_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
);

drop policy if exists "owner update open case" on public.cases;
create policy "owner update open case" on public.cases for update
using (
  (author_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
  or public.is_admin()
)
with check (
  (author_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
  or public.is_admin()
);

drop policy if exists "case owner media create" on public.case_media;
create policy "case owner media create" on public.case_media for insert with check (
  uploader_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and exists (
    select 1 from public.cases where id = case_id and author_id = auth.uid()
  )
);

drop policy if exists "authenticated comment" on public.comments;
create policy "authenticated comment" on public.comments for insert with check (
  author_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
);

drop policy if exists "own comment edit" on public.comments;
create policy "own comment edit" on public.comments for update
using (
  (author_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
  or public.is_admin()
)
with check (
  (author_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
  or public.is_admin()
);

drop policy if exists "own reactions" on public.comment_reactions;
create policy "own reactions" on public.comment_reactions for all
using (user_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
with check (user_id = auth.uid() and public.has_completed_onboarding(auth.uid()));

drop policy if exists "questioner creates resolution" on public.case_resolutions;
create policy "questioner creates resolution" on public.case_resolutions for insert with check (
  author_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and exists (
    select 1 from public.cases where id = case_id and author_id = auth.uid()
  )
);

drop policy if exists "eligible questioner creates request" on public.repair_requests;
create policy "eligible questioner creates request" on public.repair_requests for insert with check (
  requester_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = case_id
      and c.author_id = auth.uid()
      and c.status not in ('RESOLVED','CLOSED_UNRESOLVED')
  )
  and exists (
    select 1 from public.expert_profiles ep
    where ep.user_id = expert_id
      and ep.repair_enabled
      and ep.verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED')
  )
  and exists (
    select 1 from public.comments cm
    where cm.case_id = case_id
      and cm.author_id = expert_id
      and cm.valid_expert_answer
      and cm.deleted_at is null
  )
  and not exists (
    select 1 from public.repair_requests rr
    where rr.case_id = case_id and rr.status in ('PENDING','ACCEPTED')
  )
);

drop policy if exists "message parties create" on public.repair_request_messages;
create policy "message parties create" on public.repair_request_messages for insert with check (
  sender_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
  and exists (
    select 1 from public.repair_requests r
    where r.id = repair_request_id
      and (r.requester_id = auth.uid() or r.expert_id = auth.uid())
  )
);

drop policy if exists "own saved cases" on public.saved_cases;
create policy "own saved cases" on public.saved_cases for all
using (user_id = auth.uid() and public.has_completed_onboarding(auth.uid()))
with check (user_id = auth.uid() and public.has_completed_onboarding(auth.uid()));

drop policy if exists "authenticated report" on public.reports;
create policy "authenticated report" on public.reports for insert with check (
  reporter_id = auth.uid()
  and public.has_completed_onboarding(auth.uid())
);

create or replace function public.create_repair_request(
  p_case_id uuid,
  p_expert_id uuid,
  p_method text,
  p_preferred_date date,
  p_note text
)
returns public.repair_requests
language plpgsql
security definer
set search_path = public
as $$
declare result public.repair_requests;
begin
  if not public.has_completed_onboarding(auth.uid()) then
    raise exception '회원가입을 완료한 뒤 수리를 요청할 수 있습니다.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.cases
    where id = p_case_id
      and author_id = auth.uid()
      and status not in ('RESOLVED','CLOSED_UNRESOLVED')
  ) then
    raise exception '질문자만 진행 중인 자신의 질문에서 요청할 수 있습니다.';
  end if;
  if not exists (
    select 1 from public.expert_profiles
    where user_id = p_expert_id
      and repair_enabled
      and verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED')
  ) then
    raise exception '현재 수리 요청을 받을 수 없는 전문가입니다.';
  end if;
  if not exists (
    select 1 from public.comments
    where case_id = p_case_id
      and author_id = p_expert_id
      and valid_expert_answer
      and deleted_at is null
  ) then
    raise exception '유효한 답변을 남긴 전문가에게만 요청할 수 있습니다.';
  end if;
  if exists (
    select 1 from public.repair_requests
    where case_id = p_case_id and status in ('PENDING','ACCEPTED')
  ) then
    raise exception '이미 활성 수리 요청이 있습니다.';
  end if;

  insert into public.repair_requests (
    case_id, requester_id, expert_id, method, preferred_date, note
  ) values (
    p_case_id,
    auth.uid(),
    p_expert_id,
    p_method::public.repair_method,
    p_preferred_date,
    coalesce(p_note, '')
  ) returning * into result;

  update public.cases
  set status = 'REPAIR_REQUESTED', updated_at = now()
  where id = p_case_id;
  return result;
end;
$$;

revoke all on function public.create_repair_request(uuid, uuid, text, date, text) from public;
grant execute on function public.create_repair_request(uuid, uuid, text, date, text) to authenticated;

create or replace function public.resolve_case(p_case_id uuid, p_resolution jsonb)
returns public.case_resolutions
language plpgsql
security definer
set search_path = public
as $$
declare result public.case_resolutions;
begin
  if not public.has_completed_onboarding(auth.uid()) then
    raise exception '회원가입을 완료한 뒤 해결 결과를 등록할 수 있습니다.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.cases where id = p_case_id and author_id = auth.uid()
  ) then
    raise exception '질문자만 해결 결과를 등록할 수 있습니다.';
  end if;

  insert into public.case_resolutions (
    case_id, author_id, method, cause, summary, actual_cost, duration, working, review
  ) values (
    p_case_id,
    auth.uid(),
    p_resolution->>'method',
    p_resolution->>'cause',
    p_resolution->>'summary',
    nullif(p_resolution->>'cost','')::integer,
    p_resolution->>'duration',
    coalesce((p_resolution->>'working')::boolean, false),
    p_resolution->>'review'
  ) returning * into result;

  update public.cases
  set status = case
    when p_resolution->>'method' = '미해결 종료'
      then 'CLOSED_UNRESOLVED'::public.case_status
    else 'RESOLVED'::public.case_status
  end,
  updated_at = now()
  where id = p_case_id;
  return result;
end;
$$;

revoke all on function public.resolve_case(uuid, jsonb) from public;
grant execute on function public.resolve_case(uuid, jsonb) to authenticated;
