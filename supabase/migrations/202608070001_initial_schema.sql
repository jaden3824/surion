create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.expert_verification_status as enum ('NONE','PENDING','PERSONAL_VERIFIED','BUSINESS_VERIFIED','REJECTED','SUSPENDED');
create type public.case_status as enum ('OPEN','NEEDS_INFORMATION','DIAGNOSING','REPAIR_REQUESTED','IN_REPAIR','RESOLVED','CLOSED_UNRESOLVED');
create type public.model_identification_status as enum ('confirmed','user_entered','unknown','admin_review_needed');
create type public.comment_type as enum ('GENERAL','EXPERT_OPINION','REQUEST_INFORMATION','USER_EXPERIENCE','RESOLUTION_UPDATE','SAFETY_WARNING');
create type public.author_role_snapshot as enum ('QUESTIONER','EXPERT','BUSINESS_EXPERT','USER','ADMIN');
create type public.repair_request_status as enum ('PENDING','ACCEPTED','REJECTED','EXPIRED','CANCELLED');
create type public.repair_method as enum ('택배','방문','출장');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 30),
  bio text not null default '',
  avatar_path text,
  is_admin boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expert_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  verification_status public.expert_verification_status not null default 'NONE',
  repair_enabled boolean not null default false,
  business_name text,
  service_regions text[] not null default '{}',
  repair_methods public.repair_method[] not null default '{}',
  average_response_minutes integer,
  active_now boolean not null default false,
  max_daily_questions integer not null default 10 check (max_daily_questions between 1 and 100),
  available_hours jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  normalized_name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  normalized_name text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique nulls not distinct (brand_id, normalized_name)
);

create table public.model_aliases (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique (model_id, normalized_alias)
);

create table public.temporary_models (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(user_id),
  brand_input text not null,
  model_input text not null,
  status text not null default 'PENDING' check (status in ('PENDING','LINKED','CREATED','REJECTED')),
  linked_model_id uuid references public.models(id),
  reviewed_by uuid references public.profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.expert_skills (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  model_id uuid references public.models(id),
  symptom_type text,
  confidence smallint not null default 3 check (confidence between 1 and 5),
  unique nulls not distinct (expert_id, category_id, brand_id, model_id, symptom_type)
);

create table public.expert_subscriptions (
  expert_id uuid primary key references public.expert_profiles(user_id) on delete cascade,
  category_ids uuid[] not null default '{}',
  brand_ids uuid[] not null default '{}',
  model_ids uuid[] not null default '{}',
  symptom_types text[] not null default '{}',
  web_notifications boolean not null default true,
  email_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id),
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  model_id uuid references public.models(id),
  temporary_model_id uuid references public.temporary_models(id),
  category text not null,
  brand text not null,
  model text not null,
  model_identification_status public.model_identification_status not null default 'confirmed',
  title text not null check (char_length(title) between 8 and 100),
  symptom text not null check (char_length(symptom) between 20 and 4000),
  symptom_type text,
  usage_period text,
  occurred_at_text text,
  attempts_text text,
  additional_info text,
  status public.case_status not null default 'OPEN',
  views_count integer not null default 0,
  comments_count integer not null default 0,
  saves_count integer not null default 0,
  helpful_count integer not null default 0,
  edit_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  uploader_id uuid not null references public.profiles(user_id),
  storage_path text not null,
  media_type text not null check (media_type in ('IMAGE','VIDEO')),
  is_private boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  description text not null,
  result text,
  sort_order integer not null default 0
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id),
  reply_to_comment_id uuid references public.comments(id),
  type public.comment_type not null default 'GENERAL',
  body text not null check (char_length(body) between 2 and 3000),
  author_role_snapshot public.author_role_snapshot not null,
  valid_expert_answer boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  reaction text not null check (reaction in ('HELPFUL','SOLVED_THIS_WAY')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, reaction)
);

create table public.case_status_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  from_status public.case_status,
  to_status public.case_status not null,
  changed_by uuid not null references public.profiles(user_id),
  reason text,
  created_at timestamptz not null default now()
);

create table public.case_resolutions (
  case_id uuid primary key references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id),
  method text not null,
  cause text not null,
  summary text not null,
  actual_cost integer check (actual_cost >= 0),
  duration text,
  helper_comment_id uuid references public.comments(id),
  working boolean not null,
  review text,
  created_at timestamptz not null default now()
);

create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  requester_id uuid not null references public.profiles(user_id),
  expert_id uuid not null references public.expert_profiles(user_id),
  method public.repair_method not null,
  preferred_date date,
  note text not null default '',
  status public.repair_request_status not null default 'PENDING',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_active_request_per_case on public.repair_requests(case_id) where status in ('PENDING','ACCEPTED');

create table public.repair_request_messages (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id),
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.saved_cases (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id),
  case_id uuid references public.cases(id),
  comment_id uuid references public.comments(id),
  reason text not null,
  details text,
  status text not null default 'OPEN' check (status in ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  resolved_by uuid references public.profiles(user_id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((case_id is not null)::int + (comment_id is not null)::int = 1)
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(user_id),
  action_type text not null,
  target_type text not null,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index cases_search_trgm on public.cases using gin ((title || ' ' || symptom || ' ' || brand || ' ' || model) gin_trgm_ops);
create index cases_category_status_created on public.cases(category_id, status, created_at desc);
create index cases_model_created on public.cases(model_id, created_at desc);
create index comments_case_created on public.comments(case_id, created_at);
create index comments_expert_valid on public.comments(author_id, case_id) where valid_expert_answer = true and deleted_at is null;
create index notifications_user_unread on public.notifications(user_id, created_at desc) where read_at is null;
create index repair_requests_expert_status on public.repair_requests(expert_id, status, created_at desc);
create index temporary_models_status on public.temporary_models(status, created_at);

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where user_id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.expert_skills enable row level security;
alter table public.expert_subscriptions enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.models enable row level security;
alter table public.model_aliases enable row level security;
alter table public.temporary_models enable row level security;
alter table public.cases enable row level security;
alter table public.case_media enable row level security;
alter table public.case_attempts enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.case_status_history enable row level security;
alter table public.case_resolutions enable row level security;
alter table public.repair_requests enable row level security;
alter table public.repair_request_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_cases enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;

create policy "public profiles readable" on public.profiles for select using (suspended_at is null or user_id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid() and is_admin = (select is_admin from public.profiles where user_id = auth.uid()));
create policy "expert profiles readable" on public.expert_profiles for select using (verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED') or user_id = auth.uid() or public.is_admin());
create policy "expert application create" on public.expert_profiles for insert with check (user_id = auth.uid() and verification_status in ('NONE','PENDING') and repair_enabled = false);
create policy "admins manage expert profiles" on public.expert_profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "verified expert skills readable" on public.expert_skills for select using (exists (select 1 from public.expert_profiles ep where ep.user_id = expert_id and (ep.verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED') or ep.user_id = auth.uid() or public.is_admin())));
create policy "experts manage own skills" on public.expert_skills for all using (expert_id = auth.uid()) with check (expert_id = auth.uid());
create policy "experts manage own subscriptions" on public.expert_subscriptions for all using (expert_id = auth.uid()) with check (expert_id = auth.uid());
create policy "catalog public read" on public.categories for select using (active);
create policy "brands public read" on public.brands for select using (active);
create policy "models public read" on public.models for select using (true);
create policy "aliases public read" on public.model_aliases for select using (true);
create policy "admins manage catalog" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage brands" on public.brands for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage models" on public.models for all using (public.is_admin()) with check (public.is_admin());
create policy "temporary owner or admin read" on public.temporary_models for select using (submitted_by = auth.uid() or public.is_admin());
create policy "temporary owner create" on public.temporary_models for insert with check (submitted_by = auth.uid() and status = 'PENDING');
create policy "cases public read" on public.cases for select using (true);
create policy "authenticated create case" on public.cases for insert with check (author_id = auth.uid());
create policy "owner update open case" on public.cases for update using (author_id = auth.uid() or public.is_admin());
create policy "public case media read" on public.case_media for select using (not is_private);
create policy "case owner media create" on public.case_media for insert with check (uploader_id = auth.uid() and exists (select 1 from public.cases where id = case_id and author_id = auth.uid()));
create policy "case attempts public read" on public.case_attempts for select using (true);
create policy "comments public read" on public.comments for select using (true);
create policy "authenticated comment" on public.comments for insert with check (author_id = auth.uid());
create policy "own comment edit" on public.comments for update using (author_id = auth.uid() or public.is_admin());
create policy "reactions public read" on public.comment_reactions for select using (true);
create policy "own reactions" on public.comment_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "status history public read" on public.case_status_history for select using (true);
create policy "resolutions public read" on public.case_resolutions for select using (true);
create policy "questioner creates resolution" on public.case_resolutions for insert with check (author_id = auth.uid() and exists (select 1 from public.cases where id = case_id and author_id = auth.uid()));
create policy "request parties read" on public.repair_requests for select using (requester_id = auth.uid() or expert_id = auth.uid() or public.is_admin());
create policy "eligible questioner creates request" on public.repair_requests for insert with check (
  requester_id = auth.uid()
  and exists (select 1 from public.cases c where c.id = case_id and c.author_id = auth.uid() and c.status not in ('RESOLVED','CLOSED_UNRESOLVED'))
  and exists (select 1 from public.expert_profiles ep where ep.user_id = expert_id and ep.repair_enabled and ep.verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED'))
  and exists (select 1 from public.comments cm where cm.case_id = case_id and cm.author_id = expert_id and cm.valid_expert_answer and cm.deleted_at is null)
  and not exists (select 1 from public.repair_requests rr where rr.case_id = case_id and rr.status in ('PENDING','ACCEPTED'))
);
create policy "request parties update" on public.repair_requests for update using (requester_id = auth.uid() or expert_id = auth.uid());
create policy "message parties read" on public.repair_request_messages for select using (exists (select 1 from public.repair_requests r where r.id = repair_request_id and (r.requester_id = auth.uid() or r.expert_id = auth.uid())));
create policy "message parties create" on public.repair_request_messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.repair_requests r where r.id = repair_request_id and (r.requester_id = auth.uid() or r.expert_id = auth.uid())));
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update using (user_id = auth.uid());
create policy "own saved cases" on public.saved_cases for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reports or admin" on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "authenticated report" on public.reports for insert with check (reporter_id = auth.uid());
create policy "admin actions read" on public.admin_actions for select using (public.is_admin());

create function public.create_repair_request(p_case_id uuid, p_expert_id uuid, p_method text, p_preferred_date date, p_note text)
returns public.repair_requests
language plpgsql security definer set search_path = public as $$
declare result public.repair_requests;
begin
  if not exists (select 1 from public.cases where id = p_case_id and author_id = auth.uid() and status not in ('RESOLVED','CLOSED_UNRESOLVED')) then raise exception '질문자만 진행 중인 자신의 질문에서 요청할 수 있습니다.'; end if;
  if not exists (select 1 from public.expert_profiles where user_id = p_expert_id and repair_enabled and verification_status in ('PERSONAL_VERIFIED','BUSINESS_VERIFIED')) then raise exception '현재 수리 요청을 받을 수 없는 전문가입니다.'; end if;
  if not exists (select 1 from public.comments where case_id = p_case_id and author_id = p_expert_id and valid_expert_answer and deleted_at is null) then raise exception '유효한 답변을 남긴 전문가에게만 요청할 수 있습니다.'; end if;
  if exists (select 1 from public.repair_requests where case_id = p_case_id and status in ('PENDING','ACCEPTED')) then raise exception '이미 활성 수리 요청이 있습니다.'; end if;
  insert into public.repair_requests(case_id, requester_id, expert_id, method, preferred_date, note)
  values (p_case_id, auth.uid(), p_expert_id, p_method::public.repair_method, p_preferred_date, coalesce(p_note,'')) returning * into result;
  update public.cases set status = 'REPAIR_REQUESTED', updated_at = now() where id = p_case_id;
  return result;
end;
$$;

create function public.resolve_case(p_case_id uuid, p_resolution jsonb)
returns public.case_resolutions
language plpgsql security definer set search_path = public as $$
declare result public.case_resolutions;
begin
  if not exists (select 1 from public.cases where id = p_case_id and author_id = auth.uid()) then raise exception '질문자만 해결 결과를 등록할 수 있습니다.'; end if;
  insert into public.case_resolutions(case_id, author_id, method, cause, summary, actual_cost, duration, helper_comment_id, working, review)
  values (p_case_id, auth.uid(), p_resolution->>'method', p_resolution->>'cause', p_resolution->>'summary', nullif(p_resolution->>'cost','')::integer, p_resolution->>'duration', nullif(p_resolution->>'helperCommentId','')::uuid, coalesce((p_resolution->>'working')::boolean,false), p_resolution->>'review') returning * into result;
  update public.cases set status = case when p_resolution->>'method' = '미해결 종료' then 'CLOSED_UNRESOLVED'::public.case_status else 'RESOLVED'::public.case_status end, updated_at = now() where id = p_case_id;
  return result;
end;
$$;
