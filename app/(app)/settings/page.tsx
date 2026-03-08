import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/settings/profile-form'
import { SchedulesManager } from '@/components/settings/schedules-manager'
import { listSchedules } from '@/lib/schedules'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, schedules] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url, phone_number')
      .eq('id', user!.id)
      .single(),
    listSchedules(user!.id),
  ])

  const profile = profileResult.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>{' '}
            <span>{profile?.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={profile?.full_name ?? ''}
            initialPhone={profile?.phone_number ?? ''}
          />
        </CardContent>
      </Card>

      <div className="max-w-2xl">
        <SchedulesManager initialSchedules={schedules} />
      </div>
    </div>
  )
}
