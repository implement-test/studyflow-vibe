'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { ProfileModal } from '@/components/profile-modal'

export function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <nav className="flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-950">
      <Link href="/dashboard" className="text-lg font-bold">
        StudyFlow_Vibe
      </Link>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      {userId && (
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          userId={userId} 
        />
      )}
    </nav>
  )
}


