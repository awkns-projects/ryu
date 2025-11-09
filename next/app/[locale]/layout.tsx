import type React from "react"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Toaster } from "sonner"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { GoAuthProvider } from "@/contexts/go-auth-context"
import "../globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: [
        { url: '/logo.png' },
      ],
      apple: [
        { url: '/logo.png' },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('ryu-theme') || 'dark';
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else {
                  root.classList.add(theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased ${instrumentSerif.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="dark" storageKey="ryu-theme">
            <GoAuthProvider>
              {children}
              <MobileBottomNav />
              <Toaster position="top-right" richColors />
            </GoAuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
