-- Run once in Supabase Dashboard > SQL Editor.
-- Shared schedule for jadwali-weekly and my-food-assistant.
create table if not exists public.shared_schedule (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('meal','task','appointment')),
  title text not null,
  details text not null default '',
  starts_at timestamptz not null,
  meal_type text not null default '',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  ingredients text not null default '',
  source_app text not null default '',
  updated_at timestamptz not null default now()
);
create index if not exists shared_schedule_user_time_idx
  on public.shared_schedule (user_id, starts_at);
alter table public.shared_schedule enable row level security;
drop policy if exists "Users can read own shared schedule" on public.shared_schedule;
create policy "Users can read own shared schedule"
  on public.shared_schedule for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users can insert own shared schedule" on public.shared_schedule;
create policy "Users can insert own shared schedule"
  on public.shared_schedule for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can update own shared schedule" on public.shared_schedule;
create policy "Users can update own shared schedule"
  on public.shared_schedule for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own shared schedule" on public.shared_schedule;
create policy "Users can delete own shared schedule"
  on public.shared_schedule for delete to authenticated
  using (auth.uid() = user_id);
