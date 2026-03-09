ALTER TABLE profiles ADD COLUMN IF NOT EXISTS layout_config JSONB NOT NULL DEFAULT '{
  "dashboard": {
    "quick_stats": true,
    "calendar": true,
    "email": true,
    "slack": true,
    "linear": true
  },
  "analytics": {
    "db_stats": true,
    "meeting_load": true,
    "linear_breakdown": true,
    "time_breakdown": true
  }
}'::jsonb;
