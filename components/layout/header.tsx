import { createClient } from '@/lib/supabase/server'
import { UserNav } from './user-nav'
import { MobileMenuButton } from './mobile-menu-button'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <MobileMenuButton />
      <div className="flex flex-1 items-center justify-end">
        <UserNav
          name={profile?.full_name ?? profile?.email ?? ''}
          email={profile?.email ?? ''}
          avatarUrl={profile?.avatar_url ?? ''}
        />
      </div>
    </header>
  )
}
