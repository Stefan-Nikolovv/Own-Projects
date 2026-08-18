begin;

-- UPDATE events need the previous lock values for reopened-day notifications.
alter table public.slots replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'slots'
  ) then
    alter publication supabase_realtime add table public.slots;
  end if;
end;
$$;

commit;
