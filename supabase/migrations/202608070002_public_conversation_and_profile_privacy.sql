-- Public conversation no longer selects a single accepted answer.
-- Keep only the lightweight helpful reaction and remove live activity exposure.
delete from public.comment_reactions solved
where solved.reaction = 'SOLVED_THIS_WAY'
  and exists (
    select 1 from public.comment_reactions helpful
    where helpful.comment_id = solved.comment_id
      and helpful.user_id = solved.user_id
      and helpful.reaction = 'HELPFUL'
  );

update public.comment_reactions
set reaction = 'HELPFUL'
where reaction = 'SOLVED_THIS_WAY';

alter table public.comment_reactions
  drop constraint if exists comment_reactions_reaction_check;

alter table public.comment_reactions
  add constraint comment_reactions_reaction_check check (reaction = 'HELPFUL');

alter table public.case_resolutions
  drop column if exists helper_comment_id;

alter table public.expert_profiles
  drop column if exists active_now;

create or replace function public.resolve_case(p_case_id uuid, p_resolution jsonb)
returns public.case_resolutions
language plpgsql security definer set search_path = public as $$
declare result public.case_resolutions;
begin
  if not exists (select 1 from public.cases where id = p_case_id and author_id = auth.uid()) then
    raise exception '질문자만 해결 결과를 등록할 수 있습니다.';
  end if;

  insert into public.case_resolutions(case_id, author_id, method, cause, summary, actual_cost, duration, working, review)
  values (
    p_case_id,
    auth.uid(),
    p_resolution->>'method',
    p_resolution->>'cause',
    p_resolution->>'summary',
    nullif(p_resolution->>'cost','')::integer,
    p_resolution->>'duration',
    coalesce((p_resolution->>'working')::boolean,false),
    p_resolution->>'review'
  )
  returning * into result;

  update public.cases
  set status = case
    when p_resolution->>'method' = '미해결 종료' then 'CLOSED_UNRESOLVED'::public.case_status
    else 'RESOLVED'::public.case_status
  end,
  updated_at = now()
  where id = p_case_id;

  return result;
end;
$$;
