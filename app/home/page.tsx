"use client"

export const dynamic = 'force-dynamic'

import Dashboard from "@/components/dashboard"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabaseClient"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }
      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle()
      if (!profile || !profile.full_name || !profile.role) {
        router.replace("/setup-profile")
      }
    }
    check()
  }, [router])

  return <Dashboard />
}

