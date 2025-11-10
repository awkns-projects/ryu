"use client"

import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import Image from "next/image"
import { LanguageSwitcher } from "./language-switcher"
import { PointsBadge } from "./points-badge"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type AppHeaderProps = {
  locale?: string
  activeTab?: "home" | "trade" | "marketplace" | "explorer"
}

export default function AppHeader({ locale: propLocale, activeTab = "marketplace" }: AppHeaderProps) {
  const router = useRouter()
  const currentLocale = useLocale()
  const locale = propLocale || currentLocale // Use prop locale if provided, otherwise use hook
  const t = useTranslations('marketplaceHeader')
  const [userPoints, setUserPoints] = useState<number>(0)
  const [pointsLoading, setPointsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    // Delay navigation to show animation
    setTimeout(() => {
      router.push(path)
    }, 400)
  }

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
    <>
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.button
              onClick={() => handleNavigation(`/${locale}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isTransitioning}
            >
              <Image
                src="/logo.png"
                alt="Ryu"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-white font-semibold text-lg">Ryu</span>
            </motion.button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`text-sm font-medium transition-colors relative ${activeTab === item.id
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isTransitioning}
                >
                  {item.label}
                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white -mb-4"></div>
                  )}
                </motion.button>
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

      {/* Page Transition Overlay - Rendered outside sticky header */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

