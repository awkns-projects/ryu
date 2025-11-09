"use client"

import ShaderBackground from "@/components/shader/shader-background"
import ShaderHeader from "@/components/shader/shader-header"
import HeroContent from "@/components/shader/hero-content"
import PulsingCircle from "@/components/shader/pulsing-circle"
import HowItWorksSection from "@/components/shader/how-it-works-section"
import MarketplaceSection from "@/components/shader/marketplace-section"

export default function TestPage() {
  return (
    <div className="relative">
      <ShaderBackground>
        <ShaderHeader />
        <HeroContent />
        <PulsingCircle />
      </ShaderBackground>
      <div className="relative bg-gradient-to-b from-transparent via-black/50 to-black pt-20">
        <HowItWorksSection />
      </div>
      <div className="relative bg-gradient-to-b from-black via-black/80 to-black/50 pb-20">
        <MarketplaceSection />
      </div>
    </div>
  )
}

