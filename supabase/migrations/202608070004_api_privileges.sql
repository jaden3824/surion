-- Supabase no longer auto-exposes newly created public tables. Keep the API
-- surface explicit and let the row-level security policies decide which rows
-- each role can read or change.
grant usage on schema public to anon, authenticated;

grant select on table
  public.profiles,
  public.expert_profiles,
  public.expert_skills,
  public.categories,
  public.brands,
  public.models,
  public.model_aliases,
  public.cases,
  public.case_media,
  public.case_attempts,
  public.comments,
  public.comment_reactions,
  public.case_status_history,
  public.case_resolutions
to anon, authenticated;

grant update on table public.profiles to authenticated;

grant insert, update on table public.expert_profiles to authenticated;
grant insert, update, delete on table public.expert_skills to authenticated;
grant select, insert, update, delete on table public.expert_subscriptions to authenticated;

grant select, insert on table public.temporary_models to authenticated;
grant insert, update on table public.cases to authenticated;
grant insert on table public.case_media to authenticated;
grant insert, update on table public.comments to authenticated;
grant insert, update, delete on table public.comment_reactions to authenticated;
grant insert on table public.case_resolutions to authenticated;

grant select, insert, update on table public.repair_requests to authenticated;
grant select, insert on table public.repair_request_messages to authenticated;
grant select, update on table public.notifications to authenticated;
grant select, insert, update, delete on table public.saved_cases to authenticated;
grant select, insert on table public.reports to authenticated;
grant select on table public.admin_actions to authenticated;

grant select, insert, update on table public.account_consents to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
