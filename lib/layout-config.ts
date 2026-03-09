export interface DashboardLayout {
  [key: string]: boolean
  quick_stats: boolean
  calendar: boolean
  email: boolean
  slack: boolean
  linear: boolean
}

export interface AnalyticsLayout {
  [key: string]: boolean
  db_stats: boolean
  meeting_load: boolean
  linear_breakdown: boolean
  time_breakdown: boolean
}

export interface LayoutConfig {
  dashboard: DashboardLayout
  analytics: AnalyticsLayout
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  dashboard: {
    quick_stats: true,
    calendar: true,
    email: true,
    slack: true,
    linear: true,
  },
  analytics: {
    db_stats: true,
    meeting_load: true,
    linear_breakdown: true,
    time_breakdown: true,
  },
}

export function mergeLayoutConfig(stored: Partial<LayoutConfig> | null): LayoutConfig {
  return {
    dashboard: { ...DEFAULT_LAYOUT.dashboard, ...stored?.dashboard },
    analytics: { ...DEFAULT_LAYOUT.analytics, ...stored?.analytics },
  }
}
