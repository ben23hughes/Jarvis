-- Health metrics table (daily aggregated data from Apple Health export)
create table if not exists health_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  steps integer,
  heart_rate_avg numeric,
  resting_heart_rate numeric,
  active_calories numeric,
  distance_km numeric,
  weight_kg numeric,
  sleep_minutes integer,
  blood_pressure_systolic numeric,
  blood_pressure_diastolic numeric,
  oxygen_saturation numeric,
  exercise_minutes integer,
  mindful_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table health_metrics enable row level security;

create policy "Users can manage their own health metrics"
  on health_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index health_metrics_user_date on health_metrics(user_id, date desc);
