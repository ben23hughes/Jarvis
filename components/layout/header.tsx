import { createClient } from '@/lib/supabase/server'
import { UserNav } from './user-nav'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <header className="flex h-14 items-center justify-end border-b bg-card px-6">
      <UserNav
        name={profile?.full_name ?? profile?.email ?? ''}
        email={profile?.email ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
      />
    </header>
  )
}
