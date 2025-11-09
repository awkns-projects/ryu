'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, Sparkles, ArrowRight, CreditCard } from 'lucide-react';
import { SubscriptionModal } from '@/components/billing/subscription-modal';
import { SubscriptionHistory } from '@/components/billing/subscription-history';
import type { SubscriptionPlan } from '@/lib/types/billing';
import { useLocale } from 'next-intl';
import { TemplatesHeader } from '@/components/templates/templates-header';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const locale = useLocale();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [stripeCustomerId, setStripeCustomerId] = useState('');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/subscription/plans');
        const data = await response.json();

        if (!data || data.length === 0) {
          setInitializing(true);
          const initResponse = await fetch('/api/subscription/init-plans', { method: 'POST' });
          if (initResponse.ok) {
            const retryResponse = await fetch('/api/subscription/plans');
            const retryData = await retryResponse.json();
            setPlans(retryData);
          }
          setInitializing(false);
        } else {
          setPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/get-session');
        if (response.ok) {
          const data = await response.json();
          if (data?.user) {
            setUserEmail(data.user.email || '');
            setUserId(data.user.id || '');

            const customerResponse = await fetch('/api/stripe/customer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.user.email,
                name: data.user.name,
                userId: data.user.id,
              }),
            });

            if (customerResponse.ok) {
              const customerData = await customerResponse.json();
              setStripeCustomerId(customerData.customerId);
            }
          }
        }
      } catch (error) {
        console.log('ℹ️ User not logged in');
      }
    }

    checkAuth();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.amount === 0) {
      alert('Free plan is automatically activated for all users!');
      return;
    }

    if (!userId) {
      window.location.href = `/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/billing`)}`;
      return;
    }

    setSelectedPlan(plan);
    setShowSubscriptionModal(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !userId) return;

    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan.stripePriceId,
          userId,
          isUpgrade: false,
        }),
      });

      const { url, error } = await response.json();
      if (error) {
        alert('Failed to create checkout session. Please try again.');
        return;
      }
      if (url) window.location.href = url;
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, immediateCancel: true }),
      });

      if (response.ok) {
        alert('Subscription cancelled successfully');
        window.location.reload();
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (error) {
      alert('Failed to cancel subscription');
    }
  };

  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            {initializing ? 'Initializing plans...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TemplatesHeader pageTitle="Billing & Subscriptions" />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto max-w-7xl px-4 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Billing & Subscriptions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Choose the perfect plan for your needs. Upgrade, downgrade, or cancel anytime.
            </p>
            {userEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span>{userEmail}</span>
              </div>
            )}
          </div>

          {/* Show subscription management directly on page when user is logged in */}
          {userEmail && userId && stripeCustomerId && (
            <div className="mt-8">
              <SubscriptionHistory
                user={{ id: userId, email: userEmail, stripeCustomerId }}
                subscriptionPlans={plans}
                onCancel={handleCancelSubscription}
                inline={true}
              />
            </div>
          )}

          <div className="text-center mt-16 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 backdrop-blur-sm mb-6">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Simple, Transparent Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="block">Choose the perfect plan</span>
              <span className="block text-primary">for your needs</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scale as you grow with our flexible options
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPro = plan.isPopular;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden",
                    isPro && "border-foreground/20 shadow-lg md:scale-105",
                    "before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgb(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--border))_1px,transparent_1px)] before:bg-[size:14px_14px] before:opacity-30 before:z-0",
                    "[&>*]:relative [&>*]:z-10"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-foreground/20 bg-foreground text-background text-xs font-semibold shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Icon & Name */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm mb-4">
                        <span className="text-4xl">{plan.emoji}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center py-4">
                      {plan.amount === 0 ? (
                        <div className="text-4xl font-bold">Free</div>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold">${(plan.amount / 100).toFixed(0)}</span>
                          <span className="text-muted-foreground text-lg">/month</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border"></div>

                    {/* Features */}
                    <ul className="space-y-3 min-h-[280px]">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={cn(
                        "w-full font-semibold",
                        isPro && "bg-foreground text-background hover:bg-foreground/90"
                      )}
                      variant={isPro ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.amount === 0
                        ? 'Get Started'
                        : userEmail
                          ? 'Subscribe Now'
                          : 'Sign In to Subscribe'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              All plans include 24/7 support • Cancel anytime • No hidden fees
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto max-w-4xl px-4 mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our pricing</p>
          </div>

          <div className="grid gap-4">
            {[
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes! You can change your plan at any time. Upgrades are prorated, so you only pay for the difference.'
              },
              {
                q: 'What happens if I exceed my plan limits?',
                a: 'Pro and Enterprise plans charge a small overage fee only for what you use beyond your included quota.'
              },
              {
                q: 'Can I cancel my subscription?',
                a: 'Absolutely. You can cancel anytime from your subscription dashboard. You\'ll continue to have access until the end of your billing period.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards through Stripe. You can manage your payment methods in your subscription dashboard.'
              }
            ].map((faq, index) => (
              <Card
                key={index}
                className="p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {selectedPlan && userEmail && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          selectedPlan={selectedPlan}
          email={userEmail}
          onSubscribe={handleSubscribe}
          onEmailClick={() => {
            window.location.href = `/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/billing`)}`;
          }}
        />
      )}
    </div>
  );
}
