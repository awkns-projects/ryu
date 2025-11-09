"use client"

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

export default function HowItWorksSection() {
  const t = useTranslations('howItWorksSection')
  const locale = useLocale()

  return (
    <section id="how-it-works" className="relative z-20 px-8 py-16 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
          {t('title')} <span className="font-medium italic instrument">{t('titleHighlight')}</span>
        </h2>
        <p className="text-sm font-light text-white/70 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="group relative h-full">
          <div className="relative h-full p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/20 hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)] flex flex-col">
            {/* Glass shine effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Step Number */}
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white to-white/90 text-black flex items-center justify-center font-medium text-lg shadow-lg">
              1
            </div>

            {/* Visual */}
            <div className="mb-6 mt-4 flex-shrink-0">
              <div className="relative w-full h-40 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />
                <div className="relative h-full flex flex-col justify-center space-y-2">
                  {/* News Source 1 */}
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/50 font-medium">Bloomberg</div>
                      <div className="text-[10px] text-white/70 truncate">{t('step1.news1')}</div>
                    </div>
                  </div>

                  {/* News Source 2 */}
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/50 font-medium">Reuters</div>
                      <div className="text-[10px] text-white/70 truncate">{t('step1.news2')}</div>
                    </div>
                  </div>

                  {/* News Source 3 */}
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/50 font-medium">CoinDesk</div>
                      <div className="text-[10px] text-white/70 truncate">{t('step1.news3')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-medium text-white mb-3">{t('step1.title')}</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                {t('step1.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="group relative h-full">
          <div className="relative h-full p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/20 hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)] flex flex-col">
            {/* Glass shine effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Step Number */}
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white to-white/90 text-black flex items-center justify-center font-medium text-lg shadow-lg">
              2
            </div>

            {/* Visual */}
            <div className="mb-6 mt-4 flex-shrink-0">
              <div className="relative w-full h-40 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />
                <div className="relative h-full flex flex-col items-center justify-center gap-3">
                  {/* Asset Icons */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">₿</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">Ξ</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-xs font-bold text-white">$</span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-white/70">{t('step2.assets')}</div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 px-3 rounded-full bg-white/10 border border-white/10 flex items-center">
                      <span className="text-[10px] text-white/60">{t('step2.tag1')}</span>
                    </div>
                    <div className="h-6 px-3 rounded-full bg-white/10 border border-white/10 flex items-center">
                      <span className="text-[10px] text-white/60">{t('step2.tag2')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-medium text-white mb-3">{t('step2.title')}</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                {t('step2.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="group relative h-full">
          <div className="relative h-full p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/20 hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300 shadow-[0_8px_32px_0_rgba(255,255,255,0.05)] flex flex-col">
            {/* Glass shine effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Step Number */}
            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white to-white/90 text-black flex items-center justify-center font-medium text-lg shadow-lg">
              3
            </div>

            {/* Visual */}
            <div className="mb-6 mt-4 flex-shrink-0">
              <div className="relative w-full h-40 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />
                <div className="relative h-full p-4 flex flex-col justify-center space-y-2">
                  {/* Trading Activity Rows */}
                  <div className="flex items-center gap-2 h-7 px-3 bg-white/5 rounded border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-[10px] text-white/70">{t('step3.activity1')}</span>
                    <span className="ml-auto text-[10px] text-green-400">+2.4%</span>
                  </div>
                  <div className="flex items-center gap-2 h-7 px-3 bg-white/5 rounded border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-[10px] text-white/70">{t('step3.activity2')}</span>
                    <span className="ml-auto text-[10px] text-blue-400">+1.2%</span>
                  </div>
                  <div className="flex items-center gap-2 h-7 px-3 bg-white/5 rounded border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] text-white/70">{t('step3.activity3')}</span>
                    <div className="ml-auto flex gap-1">
                      <div className="w-1 h-3 bg-white/30 rounded" />
                      <div className="w-1 h-4 bg-white/40 rounded" />
                      <div className="w-1 h-3 bg-white/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-medium text-white mb-3">{t('step3.title')}</h3>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                {t('step3.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Below Steps */}
      <div className="text-center mt-12">
        <Link href={`/${locale}/trade`} className="inline-block px-10 py-4 rounded-full bg-white text-black font-medium text-sm transition-all duration-200 hover:bg-white/90 hover:scale-105 cursor-pointer">
          {t('cta')} →
        </Link>
      </div>
    </section>
  )
}

