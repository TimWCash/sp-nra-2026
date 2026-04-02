"use client"

import { useState } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { BottomNav, type PageId } from "@/components/layout/BottomNav"
import { OnboardingModal } from "@/components/OnboardingModal"
import { HomePage } from "@/components/pages/HomePage"
import { SchedulePage } from "@/components/pages/SchedulePage"
import { BoothPage } from "@/components/pages/BoothPage"
import { TeamPage } from "@/components/pages/TeamPage"
import { TalkingPage } from "@/components/pages/TalkingPage"
import { LeadsPage } from "@/components/pages/LeadsPage"
import { PodcastPage } from "@/components/pages/PodcastPage"
import { TeamStatusPage } from "@/components/pages/TeamStatusPage"
import { LoadInOutPage } from "@/components/pages/LoadInOutPage"
import { MorePage } from "@/components/pages/MorePage"

const pages: Record<PageId, React.ComponentType<{ onNavigate?: (page: PageId) => void }>> = {
  home: HomePage,
  schedule: SchedulePage,
  booth: BoothPage,
  team: TeamPage,
  talk: TalkingPage,
  leads: LeadsPage,
  podcast: PodcastPage,
  status: TeamStatusPage,
  loadin: LoadInOutPage,
  more: MorePage,
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("home")

  function navigate(page: PageId) {
    setActivePage(page)
    window.scrollTo(0, 0)
  }

  const PageComponent = pages[activePage]

  return (
    <>
      <OnboardingModal />
      <TopBar />
      <main className="pt-[64px] px-4 pb-[90px] min-h-screen">
        <PageComponent onNavigate={navigate} />
      </main>
      <BottomNav active={activePage} onChange={navigate} />
    </>
  )
}
