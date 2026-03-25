import { getAppleCalendarEvents, createAppleCalendarEvent, deleteAppleCalendarEvent } from '@/lib/integrations/apple-calendar'
import { getHealthSummary, getHealthMetrics } from '@/lib/health'
import { getMyTweets, getMyMentions, searchTweets, postTweet } from '@/lib/integrations/x'
import { getMyPages, getPagePosts, postToPage } from '@/lib/integrations/facebook'
import { getInstagramProfile, getInstagramMedia, createInstagramPost } from '@/lib/integrations/instagram'
import { getUpcomingEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/integrations/google-calendar'
import { getUpcomingMeetings, createZoomMeeting, getZoomRecordings } from '@/lib/integrations/zoom'
import { getJoinedTeams, getTeamChannels, getChannelMessages, sendChannelMessage } from '@/lib/integrations/microsoft-teams'
import { getRecentEmails, searchEmails, sendEmail, replyToEmail } from '@/lib/integrations/gmail'
import { getRecentMessages, searchSlackMessages, sendSlackMessage } from '@/lib/integrations/slack'
import { getMyIssues, searchLinearIssues, createLinearIssue, updateLinearIssue } from '@/lib/integrations/linear'
import { getMyPullRequests, getAssignedIssues, searchGithub } from '@/lib/integrations/github'
import { searchNotionPages, getNotionPageContent, createNotionPage } from '@/lib/integrations/notion'
import { searchDriveFiles, getDriveFileContent } from '@/lib/integrations/google-drive'
import { listContacts, createContact, updateContact } from '@/lib/contacts'
import { saveMemory, listMemories } from '@/lib/memories'
import { createReminder, listReminders } from '@/lib/reminders'
import { createSchedule, listSchedules, deleteSchedule, updateSchedule } from '@/lib/schedules'
import { sendSmsToUser, sendSmsToContact } from '@/lib/twilio'
import { webSearch } from '@/lib/tavily'
import { listGoals, createGoal, updateGoal } from '@/lib/goals'
import type { GoalCategory, GoalStatus } from '@/lib/goals'
import { dispatchAgentTask } from '@/lib/agent'
import { countLeads, searchLeads, exportLeadsAsCsv } from '@/lib/integrations/leadvault'
import { sendEmailWithAttachment } from '@/lib/integrations/gmail'
import { createClient } from '@supabase/supabase-js'
import { getNowPlaying, getRecentlyPlayed, getTopTracks, searchSpotify, controlPlayback, setVolume } from '@/lib/integrations/spotify'
import { getYnabBudgetSummary, getYnabAccounts, getYnabTransactions } from '@/lib/integrations/ynab'
import { getTasks, createTask, completeTask } from '@/lib/integrations/todoist'
import { getHomeFeed, getSubredditPosts, searchReddit } from '@/lib/integrations/reddit'
import { getCurrentWeather, getWeatherForecast } from '@/lib/integrations/weather'
import { searchYelp } from '@/lib/integrations/yelp'
import { getTopHeadlines, searchNews } from '@/lib/integrations/news'
import { listGoveeDevices, turnGoveeLight, setGoveeBrightness, setGoveeColor } from '@/lib/integrations/govee'
import { getPlaidAccounts, getPlaidTransactions, getSpendingSummary } from '@/lib/integrations/plaid'
import { getAlpacaAccount, getAlpacaPositions, getAlpacaPortfolioHistory, getAlpacaOrders } from '@/lib/integrations/alpaca'
import { getCoinbasePortfolio, getCoinbaseTransactions, getCryptoSpotPrice } from '@/lib/integrations/coinbase'

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    // Calendar
    case 'get_calendar_events':
      return getUpcomingEvents(userId, (input.days_ahead as number) ?? 7, (input.max_results as number) ?? 10)
    case 'create_calendar_event':
      return createCalendarEvent(userId, {
        title: input.title as string,
        start: input.start as string,
        end: input.end as string,
        description: input.description as string | undefined,
        attendees: input.attendees as string[] | undefined,
      })
    case 'update_calendar_event':
      return updateCalendarEvent(userId, input.event_id as string, {
        title: input.title as string | undefined,
        start: input.start as string | undefined,
        end: input.end as string | undefined,
        description: input.description as string | undefined,
        attendees: input.attendees as string[] | undefined,
      })
    case 'delete_calendar_event':
      return deleteCalendarEvent(userId, input.event_id as string)

    // Gmail
    case 'get_recent_emails':
      return getRecentEmails(userId, (input.max_results as number) ?? 10)
    case 'search_emails':
      return searchEmails(userId, input.query as string, (input.max_results as number) ?? 10)
    case 'send_email':
      return sendEmail(userId, input.to as string, input.subject as string, input.body as string)
    case 'reply_to_email':
      return replyToEmail(userId, input.thread_id as string, input.to as string, input.subject as string, input.body as string)

    // Slack
    case 'get_slack_messages':
      return getRecentMessages(userId, (input.limit as number) ?? 20)
    case 'search_slack':
      return searchSlackMessages(userId, input.query as string)
    case 'send_slack_message':
      return sendSlackMessage(userId, input.channel as string, input.text as string)

    // Linear
    case 'get_linear_issues':
      return getMyIssues(userId, input.states as string[] | undefined)
    case 'search_linear':
      return searchLinearIssues(userId, input.query as string)
    case 'create_linear_issue':
      return createLinearIssue(userId, {
        title: input.title as string,
        description: input.description as string | undefined,
        priority: input.priority as number | undefined,
        teamId: input.team_id as string | undefined,
      })
    case 'update_linear_issue':
      return updateLinearIssue(userId, input.issue_id as string, {
        title: input.title as string | undefined,
        description: input.description as string | undefined,
        stateId: input.state_id as string | undefined,
        priority: input.priority as number | undefined,
      })

    // GitHub
    case 'get_github_prs':
      return getMyPullRequests(userId)
    case 'get_github_issues':
      return getAssignedIssues(userId)
    case 'search_github':
      return searchGithub(userId, input.query as string)

    // Notion
    case 'search_notion':
      return searchNotionPages(userId, input.query as string)
    case 'get_notion_page':
      return getNotionPageContent(userId, input.page_id as string)
    case 'create_notion_page':
      return createNotionPage(userId, input.title as string, input.content as string | undefined, input.parent_page_id as string | undefined)

    // Zoom
    case 'get_zoom_meetings':
      return getUpcomingMeetings(userId)
    case 'create_zoom_meeting':
      return createZoomMeeting(userId, {
        topic: input.topic as string,
        start_time: input.start_time as string,
        duration: input.duration as number,
        agenda: input.agenda as string | undefined,
      })
    case 'get_zoom_recordings':
      return getZoomRecordings(userId, input.from as string | undefined)

    // Microsoft Teams
    case 'get_teams_channels': {
      const teams = await getJoinedTeams(userId)
      const teamsWithChannels = await Promise.all(
        teams.slice(0, 5).map(async (team) => ({
          ...team,
          channels: await getTeamChannels(userId, team.id),
        }))
      )
      return teamsWithChannels
    }
    case 'get_teams_messages':
      return getChannelMessages(userId, input.team_id as string, input.channel_id as string, (input.limit as number) ?? 20)
    case 'send_teams_message':
      return sendChannelMessage(userId, input.team_id as string, input.channel_id as string, input.content as string)

    // Google Drive
    case 'search_drive':
      return searchDriveFiles(userId, input.query as string, (input.max_results as number) ?? 10)
    case 'get_drive_file':
      return getDriveFileContent(userId, input.file_id as string)

    // Contacts
    case 'lookup_contact':
      return listContacts(userId, input.query as string, 10)
    case 'list_contacts':
      return listContacts(userId, undefined, (input.limit as number) ?? 20)
    case 'create_contact':
      return createContact(userId, {
        first_name: input.first_name as string,
        last_name: input.last_name as string | undefined,
        email: input.email as string | undefined,
        phone: input.phone as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        notes: input.notes as string | undefined,
      })
    case 'update_contact':
      return updateContact(userId, input.contact_id as string, {
        first_name: input.first_name as string | undefined,
        last_name: input.last_name as string | undefined,
        email: input.email as string | undefined,
        phone: input.phone as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        notes: input.notes as string | undefined,
      })

    // Memory
    case 'remember':
      return saveMemory(userId, input.content as string, (input.category as string) ?? 'general')
    case 'recall_memories':
      return listMemories(userId, 30)

    // Reminders
    case 'create_reminder':
      return createReminder(userId, input.message as string, input.remind_at as string, (input.channel as 'sms' | 'email') ?? 'email')
    case 'list_reminders':
      return listReminders(userId)

    // Schedules
    case 'create_schedule':
      return createSchedule(userId, {
        name: input.name as string,
        prompt: input.prompt as string,
        frequency: (input.frequency as 'hourly' | 'daily' | 'weekdays' | 'weekly'),
        hour: (input.hour as number) ?? 9,
        minute: (input.minute as number) ?? 0,
        day_of_week: (input.day_of_week as number | null) ?? null,
        channel: (input.channel as 'sms' | 'email') ?? 'sms',
        enabled: true,
      })
    case 'list_schedules':
      return listSchedules(userId)
    case 'delete_schedule':
      return deleteSchedule(input.id as string, userId)
    case 'toggle_schedule':
      return updateSchedule(input.id as string, userId, { enabled: input.enabled as boolean })

    // Goals
    case 'get_goals':
      return listGoals(userId, input.category as GoalCategory | undefined, input.status as GoalStatus | undefined)
    case 'create_goal':
      return createGoal(userId, {
        title: input.title as string,
        category: input.category as GoalCategory,
        description: input.description as string | undefined,
        why: input.why as string | undefined,
        target_date: input.target_date as string | undefined,
      })
    case 'update_goal':
      return updateGoal(userId, input.goal_id as string, {
        title: input.title as string | undefined,
        description: input.description as string | undefined,
        why: input.why as string | undefined,
        progress: input.progress as number | undefined,
        status: input.status as GoalStatus | undefined,
        target_date: input.target_date as string | undefined,
      })

    // Apple Calendar
    case 'get_apple_calendar_events':
      return getAppleCalendarEvents(userId, (input.days_ahead as number) ?? 14)
    case 'create_apple_calendar_event':
      return createAppleCalendarEvent(userId, {
        title: input.title as string,
        start: input.start as string,
        end: input.end as string,
        description: input.description as string | undefined,
        location: input.location as string | undefined,
      })
    case 'delete_apple_calendar_event':
      return deleteAppleCalendarEvent(userId, input.uid as string)

    // Health
    case 'get_health_summary':
      return getHealthSummary(userId, (input.days as number) ?? 7)
    case 'get_health_metrics':
      return getHealthMetrics(userId, (input.days as number) ?? 30)

    // X (Twitter)
    case 'get_my_tweets':
      return getMyTweets(userId, (input.max_results as number) ?? 10)
    case 'get_x_mentions':
      return getMyMentions(userId, (input.max_results as number) ?? 10)
    case 'search_tweets':
      return searchTweets(userId, input.query as string, (input.max_results as number) ?? 10)
    case 'post_tweet':
      return postTweet(userId, input.text as string)

    // Facebook
    case 'get_facebook_pages':
      return getMyPages(userId)
    case 'get_page_posts':
      return getPagePosts(userId, input.page_id as string, (input.limit as number) ?? 10)
    case 'post_to_facebook':
      return postToPage(userId, input.page_id as string, input.message as string)

    // Instagram
    case 'get_instagram_profile':
      return getInstagramProfile(userId)
    case 'get_instagram_media':
      return getInstagramMedia(userId, (input.limit as number) ?? 12)
    case 'post_to_instagram':
      return createInstagramPost(userId, input.image_url as string, (input.caption as string) ?? '')

    // Spotify
    case 'get_now_playing':
      return getNowPlaying(userId)
    case 'get_recently_played':
      return getRecentlyPlayed(userId, (input.limit as number) ?? 10)
    case 'get_top_tracks':
      return getTopTracks(userId, (input.time_range as string) ?? 'short_term', (input.limit as number) ?? 10)
    case 'search_spotify':
      return searchSpotify(userId, input.query as string, (input.type as string) ?? 'track,artist,playlist')
    case 'control_spotify':
      return controlPlayback(userId, input.action as 'play' | 'pause' | 'next' | 'previous')
    case 'set_spotify_volume':
      return setVolume(userId, input.volume as number)

    // YNAB
    case 'get_ynab_summary':
      return getYnabBudgetSummary(userId)
    case 'get_ynab_accounts':
      return getYnabAccounts(userId)
    case 'get_ynab_transactions':
      return getYnabTransactions(userId, 'last-used', (input.days as number) ?? 30)

    // Todoist
    case 'get_tasks':
      return getTasks(userId, input.filter as string | undefined)
    case 'create_task':
      return createTask(userId, {
        content: input.content as string,
        description: input.description as string | undefined,
        due_string: input.due_string as string | undefined,
        priority: input.priority as number | undefined,
      })
    case 'complete_task':
      return completeTask(userId, input.task_id as string)

    // Plaid
    case 'get_bank_accounts':
      return getPlaidAccounts(userId)
    case 'get_transactions':
      return getPlaidTransactions(userId, (input.days as number) ?? 30)
    case 'get_spending_summary':
      return getSpendingSummary(userId, (input.days as number) ?? 30)

    // Weather
    case 'get_weather':
      return getCurrentWeather(input.location as string)
    case 'get_weather_forecast':
      return getWeatherForecast(input.location as string, (input.days as number) ?? 5)

    // Yelp
    case 'search_yelp':
      return searchYelp({
        location: input.location as string,
        term: input.term as string | undefined,
        limit: (input.limit as number) ?? 5,
        sort_by: input.sort_by as 'best_match' | 'rating' | 'review_count' | 'distance' | undefined,
        open_now: input.open_now as boolean | undefined,
      })

    // News
    case 'get_news':
      return getTopHeadlines({
        category: input.category as string | undefined,
        query: input.query as string | undefined,
        country: (input.country as string) ?? 'us',
        pageSize: (input.page_size as number) ?? 10,
      })
    case 'search_news':
      return searchNews(input.query as string, {
        sortBy: (input.sort_by as 'relevancy' | 'popularity' | 'publishedAt') ?? 'publishedAt',
        pageSize: (input.page_size as number) ?? 10,
      })

    // Reddit
    case 'get_reddit_feed':
      return getHomeFeed(userId, (input.limit as number) ?? 15)
    case 'get_subreddit_posts':
      return getSubredditPosts(userId, input.subreddit as string, (input.sort as string) ?? 'hot', (input.limit as number) ?? 10)
    case 'search_reddit':
      return searchReddit(userId, input.query as string, input.subreddit as string | undefined, (input.limit as number) ?? 10)

    // Govee
    case 'list_govee_lights':
      return listGoveeDevices(userId)
    case 'control_govee_light': {
      const action = input.action as string
      if (action === 'turn_on') return turnGoveeLight(userId, input.device as string, input.model as string, true)
      if (action === 'turn_off') return turnGoveeLight(userId, input.device as string, input.model as string, false)
      if (action === 'set_brightness') return setGoveeBrightness(userId, input.device as string, input.model as string, input.brightness as number)
      if (action === 'set_color') return setGoveeColor(userId, input.device as string, input.model as string, input.color_r as number, input.color_g as number, input.color_b as number)
      throw new Error(`Unknown govee action: ${action}`)
    }

    // Alpaca
    case 'get_alpaca_account':
      return getAlpacaAccount(userId)
    case 'get_alpaca_positions':
      return getAlpacaPositions(userId)
    case 'get_alpaca_portfolio_history':
      return getAlpacaPortfolioHistory(userId, (input.period as string) ?? '1M')
    case 'get_alpaca_orders':
      return getAlpacaOrders(userId, (input.status as string) ?? 'all', (input.limit as number) ?? 20)

    // Coinbase
    case 'get_coinbase_portfolio':
      return getCoinbasePortfolio(userId)
    case 'get_coinbase_transactions':
      return getCoinbaseTransactions(userId, input.account_id as string, (input.limit as number) ?? 25)
    case 'get_crypto_price':
      return getCryptoSpotPrice(input.currency_pair as string)

    // SMS
    case 'send_sms':
      return sendSmsToUser(userId, input.message as string)
    case 'send_sms_to_contact':
      return sendSmsToContact(userId, input.contact_name as string, input.message as string)
    case 'save_phone_number': {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      // Normalize to E.164 — strip non-digits then prepend +1 for US numbers
      const digits = (input.phone_number as string).replace(/\D/g, '')
      const normalized = digits.startsWith('1') ? `+${digits}` : `+1${digits}`
      const { error: phoneErr } = await sb.from('profiles').update({ phone_number: normalized }).eq('id', userId)
      if (phoneErr) throw new Error('Failed to save phone number')
      return { ok: true, phone_number: normalized }
    }

    // Web search
    case 'web_search':
      return webSearch(input.query as string, (input.max_results as number) ?? 5)

    // LeadVault (shared global database — no userId needed)
    case 'count_leads':
      return { count: await countLeads({
        state: input.state as string | undefined,
        city: input.city as string | undefined,
        industry: input.industry as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        email_status: input.email_status as string | undefined,
        source_type: input.source_type as string | undefined,
        persona_type: input.persona_type as string | undefined,
        country: input.country as string | undefined,
      }) }

    case 'search_leads':
      return searchLeads({
        state: input.state as string | undefined,
        city: input.city as string | undefined,
        industry: input.industry as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        email_status: input.email_status as string | undefined,
        source_type: input.source_type as string | undefined,
        persona_type: input.persona_type as string | undefined,
        country: input.country as string | undefined,
      }, (input.limit as number) ?? 25)

    case 'export_leads_csv': {
      const filter = {
        state: input.state as string | undefined,
        city: input.city as string | undefined,
        industry: input.industry as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        email_status: input.email_status as string | undefined,
        source_type: input.source_type as string | undefined,
        persona_type: input.persona_type as string | undefined,
        country: input.country as string | undefined,
      }
      const { csv, count } = await exportLeadsAsCsv(filter)
      if (count === 0) return { ok: false, message: 'No leads matched the filters.' }

      // Resolve destination email
      let toEmail = input.email_to as string | undefined
      if (!toEmail) {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: profile } = await sb.from('profiles').select('email').eq('id', userId).single()
        toEmail = profile?.email
      }
      if (!toEmail) return { ok: false, message: 'No destination email found.' }

      const filename = (input.filename as string | undefined) ?? 'leads.csv'
      const filterDesc = [
        input.state && `state: ${input.state}`,
        input.city && `city: ${input.city}`,
        input.industry && `industry: ${input.industry}`,
        input.company && `company: ${input.company}`,
        input.title && `title: ${input.title}`,
      ].filter(Boolean).join(', ') || 'all leads'

      await sendEmailWithAttachment(
        userId,
        toEmail,
        `LeadVault Export — ${count.toLocaleString()} leads (${filterDesc})`,
        `Hi,\n\nAttached is your LeadVault export with ${count.toLocaleString()} leads filtered by: ${filterDesc}.\n\nGenerated by Jarvis.`,
        { filename, content: csv, mimeType: 'text/csv' }
      )
      return { ok: true, count, sent_to: toEmail, filename }
    }

    // Local agent tools (relay to user's machine)
    case 'read_file':
    case 'edit_file':
    case 'write_file':
    case 'list_files':
    case 'run_command':
    case 'search_files':
    case 'git_status':
    // Browser control
    case 'browser_navigate':
    case 'browser_screenshot':
    case 'browser_click':
    case 'browser_type':
    case 'browser_get_text':
    case 'browser_evaluate':
    case 'browser_back':
    case 'browser_close':
    // Screen control
    case 'screen_screenshot':
    case 'screen_click':
    case 'screen_type':
    // Clipboard / notifications / browser scroll
    case 'get_clipboard':
    case 'set_clipboard':
    case 'notify':
    case 'browser_scroll':
      return dispatchAgentTask(userId, toolName, input)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
