import Anthropic from '@anthropic-ai/sdk'
import type { IntegrationProvider } from '@/types/integrations'

export const ALL_TOOLS: Anthropic.Tool[] = [
  // ── Calendar ──────────────────────────────────────────────────
  {
    name: 'get_calendar_events',
    description: 'Get upcoming calendar events for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        days_ahead: { type: 'number', description: 'How many days ahead to look (default: 7)' },
        max_results: { type: 'number', description: 'Max events to return (default: 10)' },
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a new calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime' },
        end: { type: 'string', description: 'ISO 8601 datetime' },
        description: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Email addresses' },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'update_calendar_event',
    description: 'Update/reschedule an existing calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string' },
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime' },
        end: { type: 'string', description: 'ISO 8601 datetime' },
        description: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_calendar_event',
    description: 'Delete a calendar event',
    input_schema: {
      type: 'object' as const,
      properties: { event_id: { type: 'string' } },
      required: ['event_id'],
    },
  },

  // ── Gmail ──────────────────────────────────────────────────────
  {
    name: 'get_recent_emails',
    description: 'Get recent emails from inbox',
    input_schema: {
      type: 'object' as const,
      properties: { max_results: { type: 'number', description: 'Default: 10' } },
    },
  },
  {
    name: 'search_emails',
    description: 'Search Gmail messages',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Gmail search query' },
        max_results: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Plain text body' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'reply_to_email',
    description: 'Reply to an existing email thread',
    input_schema: {
      type: 'object' as const,
      properties: {
        thread_id: { type: 'string' },
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['thread_id', 'to', 'subject', 'body'],
    },
  },

  // ── Slack ──────────────────────────────────────────────────────
  {
    name: 'get_slack_messages',
    description: 'Get recent Slack messages',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 20' } },
    },
  },
  {
    name: 'search_slack',
    description: 'Search Slack messages',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'send_slack_message',
    description: 'Send a message to a Slack channel',
    input_schema: {
      type: 'object' as const,
      properties: {
        channel: { type: 'string', description: 'Channel name (e.g. #general) or ID' },
        text: { type: 'string' },
      },
      required: ['channel', 'text'],
    },
  },

  // ── Linear ─────────────────────────────────────────────────────
  {
    name: 'get_linear_issues',
    description: "Get the user's assigned Linear issues",
    input_schema: {
      type: 'object' as const,
      properties: {
        states: { type: 'array', items: { type: 'string' }, description: 'Filter by state names' },
      },
    },
  },
  {
    name: 'search_linear',
    description: 'Search Linear issues',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'create_linear_issue',
    description: 'Create a new Linear issue',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string', description: 'Markdown' },
        priority: { type: 'number', description: '0=none,1=urgent,2=high,3=medium,4=low' },
        team_id: { type: 'string', description: 'Optional, uses first team if omitted' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_linear_issue',
    description: 'Update a Linear issue',
    input_schema: {
      type: 'object' as const,
      properties: {
        issue_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        state_id: { type: 'string' },
        priority: { type: 'number' },
      },
      required: ['issue_id'],
    },
  },

  // ── GitHub ─────────────────────────────────────────────────────
  {
    name: 'get_github_prs',
    description: 'Get open GitHub pull requests authored by the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_github_issues',
    description: 'Get GitHub issues assigned to the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_github',
    description: 'Search GitHub issues and PRs',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },

  // ── Notion ─────────────────────────────────────────────────────
  {
    name: 'search_notion',
    description: 'Search Notion pages',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'get_notion_page',
    description: 'Get the content of a Notion page',
    input_schema: {
      type: 'object' as const,
      properties: { page_id: { type: 'string' } },
      required: ['page_id'],
    },
  },
  {
    name: 'create_notion_page',
    description: 'Create a new Notion page',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Page content' },
        parent_page_id: { type: 'string', description: 'Optional parent page' },
      },
      required: ['title'],
    },
  },

  // ── Google Drive ───────────────────────────────────────────────
  {
    name: 'search_drive',
    description: 'Search Google Drive files',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        max_results: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_drive_file',
    description: 'Get the content of a Google Drive file (Google Docs only)',
    input_schema: {
      type: 'object' as const,
      properties: { file_id: { type: 'string' } },
      required: ['file_id'],
    },
  },

  // ── Contacts ───────────────────────────────────────────────────
  {
    name: 'lookup_contact',
    description: 'Search contacts by name, email, or company',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'list_contacts',
    description: 'List all contacts',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 20' } },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact',
    input_schema: {
      type: 'object' as const,
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['first_name'],
    },
  },
  {
    name: 'update_contact',
    description: 'Update an existing contact — add or change their email, phone, company, name, notes, etc. First use lookup_contact to find the contact id.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: { type: 'string', description: 'The contact id from lookup_contact' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['contact_id'],
    },
  },

  // ── Memory ─────────────────────────────────────────────────────
  {
    name: 'remember',
    description: 'Save something meaningful about the user for future conversations. Call this proactively whenever the user mentions a person, shares a personal fact, reveals a preference, or shows a recurring pattern.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'One clear, specific sentence to remember' },
        category: {
          type: 'string',
          enum: ['people', 'facts', 'preferences', 'patterns'],
          description: 'people = someone the user mentioned; facts = stable life context; preferences = how they like things done; patterns = recurring behaviors',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'recall_memories',
    description: 'Retrieve previously saved memories about the user',
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Reminders ──────────────────────────────────────────────────
  {
    name: 'create_reminder',
    description: 'Set a reminder that will be sent via SMS or email at a specified time',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Reminder message' },
        remind_at: { type: 'string', description: 'ISO 8601 datetime' },
        channel: { type: 'string', description: '"sms" or "email" (default: email)' },
      },
      required: ['message', 'remind_at'],
    },
  },
  {
    name: 'list_reminders',
    description: 'List pending reminders',
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Schedules ──────────────────────────────────────────────────
  {
    name: 'create_schedule',
    description: 'Create a recurring scheduled task. Jarvis will run the prompt on the given schedule and deliver the result via SMS or email. Times are in MST.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Short name for the schedule' },
        prompt: { type: 'string', description: 'What Jarvis should do each time it runs' },
        frequency: { type: 'string', description: '"hourly", "daily", "weekdays", or "weekly"' },
        hour: { type: 'number', description: 'Hour in MST (0-23). Not needed for hourly.' },
        minute: { type: 'number', description: 'Minute (0-59, default 0)' },
        day_of_week: { type: 'number', description: 'Day of week for weekly (0=Sun, 1=Mon, ..., 6=Sat)' },
        channel: { type: 'string', description: '"sms" or "email" (default: sms)' },
      },
      required: ['name', 'prompt', 'frequency'],
    },
  },
  {
    name: 'list_schedules',
    description: 'List all scheduled tasks for the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'delete_schedule',
    description: 'Delete a scheduled task by id',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Schedule id' } },
      required: ['id'],
    },
  },
  {
    name: 'toggle_schedule',
    description: 'Enable or pause a scheduled task by id',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        enabled: { type: 'boolean', description: 'true to enable, false to pause' },
      },
      required: ['id', 'enabled'],
    },
  },

  // ── Apple Calendar ─────────────────────────────────────────────
  {
    name: 'get_apple_calendar_events',
    description: 'Get upcoming events from Apple Calendar (iCloud CalDAV)',
    input_schema: {
      type: 'object' as const,
      properties: {
        days_ahead: { type: 'number', description: 'How many days ahead to look (default: 14)' },
      },
    },
  },
  {
    name: 'create_apple_calendar_event',
    description: 'Create a new event in Apple Calendar',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime' },
        end: { type: 'string', description: 'ISO 8601 datetime' },
        description: { type: 'string' },
        location: { type: 'string' },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'delete_apple_calendar_event',
    description: 'Delete an event from Apple Calendar by its UID',
    input_schema: {
      type: 'object' as const,
      properties: {
        uid: { type: 'string', description: 'Event UID from get_apple_calendar_events' },
      },
      required: ['uid'],
    },
  },

  // ── Health ─────────────────────────────────────────────────────
  {
    name: 'get_health_summary',
    description: "Get a summary of the user's recent health metrics (steps, heart rate, sleep, calories, weight, exercise). Data comes from their Apple Health import.",
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'Number of days to summarize (default: 7)' },
      },
    },
  },
  {
    name: 'get_health_metrics',
    description: "Get daily health metrics for the user over a period. Returns per-day data for deeper analysis.",
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'How many days back to look (default: 30)' },
      },
    },
  },

  // ── Zoom ───────────────────────────────────────────────────────
  {
    name: 'get_zoom_meetings',
    description: 'Get upcoming Zoom meetings',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_zoom_meeting',
    description: 'Create a new Zoom meeting',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string' },
        start_time: { type: 'string', description: 'ISO 8601 datetime' },
        duration: { type: 'number', description: 'Duration in minutes' },
        agenda: { type: 'string' },
      },
      required: ['topic', 'start_time', 'duration'],
    },
  },
  {
    name: 'get_zoom_recordings',
    description: 'Get recent Zoom cloud recordings',
    input_schema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string', description: 'Start date YYYY-MM-DD (default: 30 days ago)' },
      },
    },
  },

  // ── Microsoft Teams ────────────────────────────────────────────
  {
    name: 'get_teams_channels',
    description: 'Get Teams and their channels the user belongs to',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_teams_messages',
    description: 'Get recent messages from a Teams channel',
    input_schema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string' },
        channel_id: { type: 'string' },
        limit: { type: 'number', description: 'Default: 20' },
      },
      required: ['team_id', 'channel_id'],
    },
  },
  {
    name: 'send_teams_message',
    description: 'Send a message to a Microsoft Teams channel',
    input_schema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string' },
        channel_id: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['team_id', 'channel_id', 'content'],
    },
  },

  // ── Goals ──────────────────────────────────────────────────────
  {
    name: 'get_goals',
    description: "Get the user's goals. Use this to understand what the user is working toward and provide contextual advice aligned with their aspirations.",
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: spiritual, physical, financial, career, relationships, learning, or other',
        },
        status: {
          type: 'string',
          description: 'Filter by status: active, completed, or paused. Defaults to all.',
        },
      },
    },
  },
  {
    name: 'create_goal',
    description: "Create a new goal for the user",
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Goal title' },
        category: { type: 'string', description: 'spiritual, physical, financial, career, relationships, learning, or other' },
        description: { type: 'string', description: 'More detail about the goal' },
        why: { type: 'string', description: "The user's deeper motivation for this goal" },
        target_date: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'update_goal',
    description: "Update a goal's progress, status, or details",
    input_schema: {
      type: 'object' as const,
      properties: {
        goal_id: { type: 'string', description: 'Goal ID' },
        progress: { type: 'number', description: 'Progress percentage 0-100' },
        status: { type: 'string', description: 'active, completed, or paused' },
        title: { type: 'string' },
        description: { type: 'string' },
        why: { type: 'string' },
        target_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['goal_id'],
    },
  },

  // ── X (Twitter) ────────────────────────────────────────────────
  {
    name: 'get_my_tweets',
    description: 'Get recent tweets posted by the user',
    input_schema: {
      type: 'object' as const,
      properties: { max_results: { type: 'number', description: 'Default: 10' } },
    },
  },
  {
    name: 'get_x_mentions',
    description: 'Get recent mentions of the user on X (Twitter)',
    input_schema: {
      type: 'object' as const,
      properties: { max_results: { type: 'number', description: 'Default: 10' } },
    },
  },
  {
    name: 'search_tweets',
    description: 'Search recent tweets on X (Twitter)',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Default: 10' },
      },
      required: ['query'],
    },
  },
  {
    name: 'post_tweet',
    description: 'Post a new tweet on X (Twitter)',
    input_schema: {
      type: 'object' as const,
      properties: { text: { type: 'string', description: 'Tweet text (max 280 chars)' } },
      required: ['text'],
    },
  },

  // ── Facebook ───────────────────────────────────────────────────
  {
    name: 'get_facebook_pages',
    description: 'Get Facebook Pages the user manages',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_page_posts',
    description: 'Get recent posts from a Facebook Page',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_id: { type: 'string', description: 'Facebook Page ID' },
        limit: { type: 'number', description: 'Default: 10' },
      },
      required: ['page_id'],
    },
  },
  {
    name: 'post_to_facebook',
    description: 'Post a message to a Facebook Page',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_id: { type: 'string', description: 'Facebook Page ID' },
        message: { type: 'string', description: 'Post content' },
      },
      required: ['page_id', 'message'],
    },
  },

  // ── Instagram ──────────────────────────────────────────────────
  {
    name: 'get_instagram_profile',
    description: 'Get the Instagram Business/Creator profile (followers, bio, post count)',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_instagram_media',
    description: 'Get recent Instagram posts/media with engagement stats',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 12' } },
    },
  },
  {
    name: 'post_to_instagram',
    description: 'Publish a photo to Instagram (requires a public image URL)',
    input_schema: {
      type: 'object' as const,
      properties: {
        image_url: { type: 'string', description: 'Publicly accessible URL of the image to post' },
        caption: { type: 'string', description: 'Caption for the post' },
      },
      required: ['image_url'],
    },
  },

  // ── LeadVault ──────────────────────────────────────────────────
  {
    name: 'count_leads',
    description: 'Count how many leads match the given filters in the shared LeadVault database (~200k leads). Always call this before exporting so the user knows what they are getting.',
    input_schema: {
      type: 'object' as const,
      properties: {
        state: { type: 'string', description: 'State or region (e.g. "Utah", "TX", "California")' },
        city: { type: 'string', description: 'City name (partial match)' },
        industry: { type: 'string', description: 'Industry or sector (partial match)' },
        company: { type: 'string', description: 'Company name (partial match)' },
        title: { type: 'string', description: 'Job title or position (partial match)' },
        email_status: { type: 'string', description: 'Email validity: "valid", "invalid", "risky", "unknown"' },
        source_type: { type: 'string', description: 'Data source: "linkedin", "google_maps", "apollo", "web_scrape", "enriched"' },
        persona_type: { type: 'string', description: '"company" or "person"' },
        country: { type: 'string', description: 'Country (partial match)' },
      },
    },
  },
  {
    name: 'search_leads',
    description: 'Preview leads from LeadVault matching the given filters. Returns up to 25 records with full contact details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        state: { type: 'string' },
        city: { type: 'string' },
        industry: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        email_status: { type: 'string' },
        source_type: { type: 'string' },
        persona_type: { type: 'string' },
        country: { type: 'string' },
        limit: { type: 'number', description: 'Max records to return (default: 25)' },
      },
    },
  },
  {
    name: 'export_leads_csv',
    description: 'Export up to 10,000 leads from LeadVault as a CSV and email it to the user. Include at least one filter — do not export without filters.',
    input_schema: {
      type: 'object' as const,
      properties: {
        state: { type: 'string' },
        city: { type: 'string' },
        industry: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        email_status: { type: 'string' },
        source_type: { type: 'string' },
        persona_type: { type: 'string' },
        country: { type: 'string' },
        filename: { type: 'string', description: 'CSV filename without extension (default: leads)' },
        email_to: { type: 'string', description: 'Destination email. Defaults to the user\'s email.' },
      },
    },
  },

  // ── Spotify ────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    name: 'get_now_playing',
    description: 'Get the currently playing song on Spotify',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_recently_played',
    description: 'Get recently played tracks on Spotify',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 10' } },
    },
  },
  {
    name: 'get_top_tracks',
    description: 'Get top tracks on Spotify',
    input_schema: {
      type: 'object' as const,
      properties: {
        time_range: { type: 'string', description: 'short_term (4 weeks), medium_term (6 months), long_term (all time)' },
        limit: { type: 'number', description: 'Default: 10' },
      },
    },
  },
  {
    name: 'search_spotify',
    description: 'Search Spotify for tracks, artists, or playlists',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        type: { type: 'string', description: 'track, artist, playlist (default: track,artist,playlist)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'control_spotify',
    description: 'Control Spotify playback (play, pause, next, previous)',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', description: 'play, pause, next, or previous' },
      },
      required: ['action'],
    },
  },
  {
    name: 'set_spotify_volume',
    description: 'Set Spotify volume',
    input_schema: {
      type: 'object' as const,
      properties: {
        volume: { type: 'number', description: '0-100' },
      },
      required: ['volume'],
    },
  },

  // ── YNAB ───────────────────────────────────────────────────────
  {
    name: 'get_ynab_summary',
    description: "Get the user's YNAB budget summary for the current month — budgeted vs spent by category",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_ynab_accounts',
    description: 'Get YNAB account balances',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_ynab_transactions',
    description: 'Get recent YNAB transactions',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'How many days back (default: 30)' },
      },
    },
  },

  // ── Todoist ────────────────────────────────────────────────────
  {
    name: 'get_tasks',
    description: "Get the user's Todoist tasks",
    input_schema: {
      type: 'object' as const,
      properties: {
        filter: { type: 'string', description: 'Todoist filter: today, overdue, p1, #ProjectName, etc.' },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in Todoist',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'Task name' },
        description: { type: 'string' },
        due_string: { type: 'string', description: 'Natural language due date: "tomorrow", "next monday at 2pm"' },
        priority: { type: 'number', description: '1=normal, 2=medium, 3=high, 4=urgent' },
      },
      required: ['content'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a Todoist task as complete',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'Task ID from get_tasks' },
      },
      required: ['task_id'],
    },
  },

  // ── Plaid (Banking) ────────────────────────────────────────────
  {
    name: 'get_bank_accounts',
    description: "Get the user's connected bank accounts and current balances",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_transactions',
    description: 'Get recent bank/credit card transactions from connected accounts',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'How many days back (default: 30)' },
      },
    },
  },
  {
    name: 'get_spending_summary',
    description: 'Get a summary of spending by category from connected bank accounts',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'How many days back (default: 30)' },
      },
    },
  },

  // ── Weather ────────────────────────────────────────────────────
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    input_schema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City name or "city, country" e.g. "Denver, US"' },
      },
      required: ['location'],
    },
  },
  {
    name: 'get_weather_forecast',
    description: 'Get the weather forecast for a location',
    input_schema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City name' },
        days: { type: 'number', description: 'Number of days (default: 5)' },
      },
      required: ['location'],
    },
  },

  // ── Yelp ───────────────────────────────────────────────────────
  {
    name: 'search_yelp',
    description: 'Search for local businesses, restaurants, services on Yelp',
    input_schema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City or address' },
        term: { type: 'string', description: 'What to search for (e.g. "sushi", "coffee", "plumber")' },
        limit: { type: 'number', description: 'Default: 5' },
        sort_by: { type: 'string', description: 'best_match, rating, review_count, distance' },
        open_now: { type: 'boolean' },
      },
      required: ['location', 'term'],
    },
  },

  // ── News ───────────────────────────────────────────────────────
  {
    name: 'get_news',
    description: 'Get top news headlines by category or topic',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'business, entertainment, health, science, sports, technology' },
        query: { type: 'string', description: 'Optional search query' },
        country: { type: 'string', description: 'Country code e.g. "us" (default: us)' },
        page_size: { type: 'number', description: 'Default: 10' },
      },
    },
  },
  {
    name: 'search_news',
    description: 'Search for news articles on any topic',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search terms' },
        sort_by: { type: 'string', description: 'relevancy, popularity, publishedAt (default: publishedAt)' },
        page_size: { type: 'number', description: 'Default: 10' },
      },
      required: ['query'],
    },
  },

  // ── Reddit ─────────────────────────────────────────────────────
  {
    name: 'get_reddit_feed',
    description: "Get posts from the user's Reddit home feed",
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Default: 15' },
      },
    },
  },
  {
    name: 'get_subreddit_posts',
    description: 'Get posts from a specific subreddit',
    input_schema: {
      type: 'object' as const,
      properties: {
        subreddit: { type: 'string', description: 'Subreddit name without r/' },
        sort: { type: 'string', description: 'hot, new, top, rising (default: hot)' },
        limit: { type: 'number', description: 'Default: 10' },
      },
      required: ['subreddit'],
    },
  },
  {
    name: 'search_reddit',
    description: 'Search Reddit for posts',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        subreddit: { type: 'string', description: 'Optional: limit to a specific subreddit' },
        limit: { type: 'number', description: 'Default: 10' },
      },
      required: ['query'],
    },
  },

  // ── Govee Lights ───────────────────────────────────────────────
  {
    name: 'list_govee_lights',
    description: "List all the user's Govee smart light devices",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'control_govee_light',
    description: 'Control a Govee smart light — turn on/off, set brightness or color',
    input_schema: {
      type: 'object' as const,
      properties: {
        device: { type: 'string', description: 'Device ID from list_govee_lights' },
        model: { type: 'string', description: 'Device model from list_govee_lights' },
        action: { type: 'string', description: 'turn_on, turn_off, set_brightness, set_color' },
        brightness: { type: 'number', description: '0-100 (for set_brightness)' },
        color_r: { type: 'number', description: 'Red 0-255 (for set_color)' },
        color_g: { type: 'number', description: 'Green 0-255 (for set_color)' },
        color_b: { type: 'number', description: 'Blue 0-255 (for set_color)' },
      },
      required: ['device', 'model', 'action'],
    },
  },

  // ── Alpaca Markets ─────────────────────────────────────────────
  {
    name: 'get_alpaca_account',
    description: 'Get Alpaca brokerage account details: portfolio value, buying power, cash, equity',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_alpaca_positions',
    description: 'Get current stock/ETF positions in the Alpaca portfolio',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_alpaca_portfolio_history',
    description: 'Get portfolio value history over time from Alpaca',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'Time period: 1D, 1W, 1M, 3M, 6M, 1A (default: 1M)' },
      },
    },
  },
  {
    name: 'get_alpaca_orders',
    description: 'Get recent orders from Alpaca',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'all, open, closed (default: all)' },
        limit: { type: 'number', description: 'Max orders to return (default: 20)' },
      },
    },
  },

  // ── Coinbase ───────────────────────────────────────────────────
  {
    name: 'get_coinbase_portfolio',
    description: 'Get crypto wallets/accounts from Coinbase with non-zero balances',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_coinbase_transactions',
    description: 'Get recent transactions for a Coinbase account',
    input_schema: {
      type: 'object' as const,
      properties: {
        account_id: { type: 'string', description: 'Account ID from get_coinbase_portfolio' },
        limit: { type: 'number', description: 'Max transactions (default: 25)' },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'get_crypto_price',
    description: 'Get the current spot price for a cryptocurrency pair (e.g. BTC-USD, ETH-USD)',
    input_schema: {
      type: 'object' as const,
      properties: {
        currency_pair: { type: 'string', description: 'e.g. BTC-USD, ETH-USD, SOL-USD' },
      },
      required: ['currency_pair'],
    },
  },

  // ── SMS ────────────────────────────────────────────────────────
  {
    name: 'send_sms',
    description: "Send an SMS text message to the user's phone number",
    input_schema: {
      type: 'object' as const,
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  },
  {
    name: 'save_phone_number',
    description: "Save the user's phone number to their profile so Jarvis can send SMS notifications and reminders",
    input_schema: {
      type: 'object' as const,
      properties: {
        phone_number: { type: 'string', description: 'Phone number in E.164 format e.g. +12125551234' },
      },
      required: ['phone_number'],
    },
  },

  // ── Web Search ─────────────────────────────────────────────────
  {
    name: 'web_search',
    description: 'Search the web for current information',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        max_results: { type: 'number', description: 'Default: 5' },
      },
      required: ['query'],
    },
  },

  // ── Local Agent (file system + terminal) ───────────────────────
  {
    name: 'read_file',
    description: "Read the contents of a file on the user's local machine. Requires the Jarvis local agent to be running.",
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path (absolute or relative to agent cwd)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: "Write or create a file on the user's local machine. Requires the Jarvis local agent to be running.",
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Full file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: "List files and directories on the user's local machine. Requires the Jarvis local agent to be running.",
    input_schema: {
      type: 'object' as const,
      properties: {
        directory: { type: 'string', description: 'Directory to list (default: current directory)' },
        pattern: { type: 'string', description: 'Optional filter pattern (e.g. ".ts", "components")' },
      },
    },
  },
  {
    name: 'run_command',
    description: "Run a shell command on the user's local machine. Requires the Jarvis local agent to be running. Use for running tests, builds, git commands, etc.",
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Shell command to run' },
        cwd: { type: 'string', description: 'Working directory (default: agent cwd)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'search_files',
    description: "Search file contents on the user's local machine using grep. Requires the Jarvis local agent to be running.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Text or pattern to search for' },
        directory: { type: 'string', description: 'Directory to search in (default: cwd)' },
        file_pattern: { type: 'string', description: 'File glob pattern (e.g. "*.ts", "*.tsx")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'git_status',
    description: "Get git status, current branch, and recent commits from the user's local repo. Requires the Jarvis local agent to be running.",
    input_schema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Repo directory (default: agent cwd)' },
      },
    },
  },

  // ── Browser control (via Playwright) ───────────────────────────
  {
    name: 'browser_navigate',
    description: "Navigate the user's browser to a URL. Opens a visible browser window. Returns the page title and text content. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Full URL to navigate to' },
        wait_for: { type: 'string', description: 'Optional: "load" (default), "networkidle", or a CSS selector to wait for' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_screenshot',
    description: "Take a screenshot of the current browser page. Returns the image so you can see exactly what is on screen. Use this to understand page state before clicking. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        full_page: { type: 'boolean', description: 'Capture full scrollable page (default: false, viewport only)' },
      },
    },
  },
  {
    name: 'browser_click',
    description: "Click an element in the browser. Specify by CSS selector OR visible text. After clicking, take a screenshot to see the result. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector (e.g. "#submit", ".btn-primary", "button[type=submit]")' },
        text: { type: 'string', description: 'Visible text of the element to click (e.g. "Sign in", "Next")' },
      },
    },
  },
  {
    name: 'browser_type',
    description: "Type text into an input field in the browser. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector of the input field' },
        text: { type: 'string', description: 'Text to type' },
        clear_first: { type: 'boolean', description: 'Clear existing content before typing (default: true)' },
        press_enter: { type: 'boolean', description: 'Press Enter after typing (default: false)' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'browser_get_text',
    description: "Get the text content of the current browser page or a specific element. Useful for reading data off a page. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector of element (omit for full page text)' },
      },
    },
  },
  {
    name: 'browser_evaluate',
    description: "Run JavaScript in the browser page and return the result. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        script: { type: 'string', description: 'JavaScript to evaluate (return value is captured)' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_back',
    description: "Navigate back in the browser history. Requires the Jarvis local agent.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'browser_close',
    description: "Close the browser. Call this when done with browser tasks. Requires the Jarvis local agent.",
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Screen control ──────────────────────────────────────────────
  {
    name: 'screen_screenshot',
    description: "Take a screenshot of the user's entire screen. Returns the image so you can see what is open. Requires the Jarvis local agent running on macOS.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'screen_click',
    description: "Click at specific screen coordinates. Use screen_screenshot first to find the right coordinates. Requires the Jarvis local agent on macOS.",
    input_schema: {
      type: 'object' as const,
      properties: {
        x: { type: 'number', description: 'X coordinate in pixels' },
        y: { type: 'number', description: 'Y coordinate in pixels' },
        double_click: { type: 'boolean', description: 'Double-click instead of single click' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'screen_type',
    description: "Type text on the keyboard (sent to whatever app has focus). Requires the Jarvis local agent on macOS.",
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to type' },
        press_return: { type: 'boolean', description: 'Press Return/Enter after typing' },
      },
      required: ['text'],
    },
  },

  // ── Clipboard ──────────────────────────────────────────────────
  {
    name: 'get_clipboard',
    description: "Read the current contents of the user's clipboard. Use when the user says 'use what I copied', 'take this', or pastes something they want processed. Requires the Jarvis local agent.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'set_clipboard',
    description: "Write text to the user's clipboard so they can paste it anywhere. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'Text to copy to clipboard' },
      },
      required: ['content'],
    },
  },

  // ── Notifications ──────────────────────────────────────────────
  {
    name: 'notify',
    description: "Send a native desktop notification. Use proactively when a long-running task (tests, builds, downloads) finishes so the user knows without watching the terminal. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Notification body text' },
        subtitle: { type: 'string', description: 'Optional subtitle line (macOS only)' },
      },
      required: ['message'],
    },
  },

  // ── Browser scroll ─────────────────────────────────────────────
  {
    name: 'browser_scroll',
    description: "Scroll the browser page or a specific element. Use when content is below the fold or you need to load more items. Requires the Jarvis local agent.",
    input_schema: {
      type: 'object' as const,
      properties: {
        direction: { type: 'string', enum: ['down', 'up'], description: 'Scroll direction (default: down)' },
        amount: { type: 'number', description: 'Pixels to scroll (default: 500)' },
        selector: { type: 'string', description: 'CSS selector of scrollable element (omit to scroll the page)' },
      },
    },
  },
]

const PROVIDER_TOOL_MAP: Record<string, IntegrationProvider[]> = {
  get_calendar_events: ['google_calendar'],
  create_calendar_event: ['google_calendar'],
  update_calendar_event: ['google_calendar'],
  delete_calendar_event: ['google_calendar'],
  get_recent_emails: ['gmail'],
  search_emails: ['gmail'],
  send_email: ['gmail'],
  reply_to_email: ['gmail'],
  get_slack_messages: ['slack'],
  search_slack: ['slack'],
  send_slack_message: ['slack'],
  get_linear_issues: ['linear'],
  search_linear: ['linear'],
  create_linear_issue: ['linear'],
  update_linear_issue: ['linear'],
  get_github_prs: ['github'],
  get_github_issues: ['github'],
  search_github: ['github'],
  search_notion: ['notion'],
  get_notion_page: ['notion'],
  create_notion_page: ['notion'],
  search_drive: ['google_drive'],
  get_drive_file: ['google_drive'],
  get_zoom_meetings: ['zoom'],
  create_zoom_meeting: ['zoom'],
  get_zoom_recordings: ['zoom'],
  get_teams_channels: ['microsoft_teams'],
  get_teams_messages: ['microsoft_teams'],
  send_teams_message: ['microsoft_teams'],
  get_my_tweets: ['x'],
  get_x_mentions: ['x'],
  search_tweets: ['x'],
  post_tweet: ['x'],
  get_facebook_pages: ['facebook'],
  get_page_posts: ['facebook'],
  post_to_facebook: ['facebook'],
  get_instagram_profile: ['instagram'],
  get_instagram_media: ['instagram'],
  post_to_instagram: ['instagram'],
  get_apple_calendar_events: ['apple_calendar'],
  create_apple_calendar_event: ['apple_calendar'],
  delete_apple_calendar_event: ['apple_calendar'],
  get_health_summary: [],
  get_health_metrics: [],
  // Spotify
  get_now_playing: ['spotify'],
  get_recently_played: ['spotify'],
  get_top_tracks: ['spotify'],
  search_spotify: ['spotify'],
  control_spotify: ['spotify'],
  set_spotify_volume: ['spotify'],
  // YNAB
  get_ynab_summary: ['ynab'],
  get_ynab_accounts: ['ynab'],
  get_ynab_transactions: ['ynab'],
  // Todoist
  get_tasks: ['todoist'],
  create_task: ['todoist'],
  complete_task: ['todoist'],
  // Plaid
  get_bank_accounts: ['plaid'],
  get_transactions: ['plaid'],
  get_spending_summary: ['plaid'],
  // Weather — always available (env key)
  get_weather: [],
  get_weather_forecast: [],
  // Yelp — always available
  search_yelp: [],
  // News — always available
  get_news: [],
  search_news: [],
  // Reddit
  get_reddit_feed: ['reddit'],
  get_subreddit_posts: ['reddit'],
  search_reddit: ['reddit'],
  // Govee
  list_govee_lights: ['govee'],
  control_govee_light: ['govee'],
  // Alpaca
  get_alpaca_account: ['alpaca'],
  get_alpaca_positions: ['alpaca'],
  get_alpaca_portfolio_history: ['alpaca'],
  get_alpaca_orders: ['alpaca'],
  // Coinbase
  get_coinbase_portfolio: ['coinbase'],
  get_coinbase_transactions: ['coinbase'],
  get_crypto_price: [],
  // Always available (no OAuth needed)
  lookup_contact: [],
  list_contacts: [],
  create_contact: [],
  update_contact: [],
  remember: [],
  recall_memories: [],
  create_reminder: [],
  list_reminders: [],
  create_schedule: [],
  list_schedules: [],
  delete_schedule: [],
  toggle_schedule: [],
  send_sms: [],
  web_search: [],
  // LeadVault — always present; runtime throws if not configured
  count_leads: [],
  search_leads: [],
  export_leads_csv: [],
  // Browser + screen — always present; runtime throws if agent not connected
  browser_navigate: [],
  browser_screenshot: [],
  browser_click: [],
  browser_type: [],
  browser_get_text: [],
  browser_evaluate: [],
  browser_back: [],
  browser_close: [],
  screen_screenshot: [],
  screen_click: [],
  screen_type: [],
  get_clipboard: [],
  set_clipboard: [],
  notify: [],
  browser_scroll: [],
}

export function getToolsForConnectedProviders(
  connectedProviders: IntegrationProvider[]
): Anthropic.Tool[] {
  return ALL_TOOLS.filter((tool) => {
    const required = PROVIDER_TOOL_MAP[tool.name] ?? []
    return required.every((p) => connectedProviders.includes(p))
  })
}
