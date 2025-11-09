"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import Image from "next/image"
import { LanguageSwitcher } from "./language-switcher"
import { PointsBadge } from "./points-badge"
import { useState, useEffect } from "react"

type AppHeaderProps = {
  locale: string
  activeTab?: "home" | "trade" | "marketplace" | "explorer"
}

export default function AppHeader({ locale, activeTab = "marketplace" }: AppHeaderProps) {
  const router = useRouter()
  const currentLocale = useLocale()
  const t = useTranslations('marketplaceHeader')
  const [userPoints, setUserPoints] = useState<number>(0)
  const [pointsLoading, setPointsLoading] = useState(true)

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const response = await fetch('/api/user/points')
        if (response.ok) {
          const data = await response.json()
          setUserPoints(data.points)
        }
      } catch (error) {
        console.error('Failed to fetch user points:', error)
      } finally {
        setPointsLoading(false)
      }
    }

    fetchUserPoints()
  }, [])

  const navItems = [
    { id: "home", label: t('home'), href: `/${locale}` },
    { id: "trade", label: t('trade'), href: `/${locale}/trade` },
    { id: "marketplace", label: t('marketplace'), href: `/${locale}/marketplace` },
    { id: "explorer", label: t('explorer'), href: `/${locale}/explorer` },
  ]

  return (
    <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Ryu"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-white font-semibold text-lg">Ryu</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`text-sm font-medium transition-colors relative ${activeTab === item.id
                  ? "text-white"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white -mb-4"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Points Badge & Language Switcher */}
          <div className="flex items-center gap-3">
            <PointsBadge points={userPoints} loading={pointsLoading} />
            <LanguageSwitcher />
          </div>
        </div>

      </div>
    </div>
  )
}

