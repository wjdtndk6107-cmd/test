import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import GongguDetail from './pages/GongguDetail'
import SellerDashboard from './pages/SellerDashboard'
import CreateGonggu from './pages/CreateGonggu'
import { Toaster } from '@/components/ui/toaster'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import AiAssistantDrawer from '@/components/AiAssistantDrawer'
import type { Gonggu } from '@/types'

function Navbar({ onAiClick }: { onAiClick: () => void }) {
  return (
    <header className="bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
          공구마켓
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile floating AI button → same handler */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            onClick={onAiClick}
          >
            <span className="text-sm leading-none">✦</span>
            <span className="hidden sm:inline">AI 추천</span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/seller">소상공인</Link>
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  )
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Nav-level drawer shares an empty gonggus list; Home passes its own list
  const emptyGonggus: Gonggu[] = []

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar onAiClick={() => setDrawerOpen(true)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gonggu/:id" element={<GongguDetail />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/create" element={<CreateGonggu />} />
        </Routes>
      </div>

      {/* Nav-level drawer (opened from non-Home pages) */}
      <AiAssistantDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        gonggus={emptyGonggus}
      />

      <Toaster />
    </BrowserRouter>
  )
}
