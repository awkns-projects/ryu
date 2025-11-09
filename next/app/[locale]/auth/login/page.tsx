"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { RetroGrid } from "@/registry/magicui/retro-grid";

type LoginStep = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (otpError) {
        setError(otpError.message || "Failed to send verification code");
        return;
      }

      setSuccess("Verification code sent to your email!");
      setStep("otp");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: signInError } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (signInError) {
        setError(signInError.message || "Invalid verification code");
        return;
      }

      setSuccess("Welcome!");

      // Get redirect path from URL params or default to home
      const redirectTo = searchParams.get("redirect") || `/${locale}`;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setSuccess("New verification code sent!");
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header with logo and back button */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Ryu Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold">Ryu</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Ryu</h1>
            <p className="text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === "email" ? "Enter your email" : "Verify your code"}
              </CardTitle>
              <CardDescription>
                {step === "email"
                  ? "We'll send you a verification code. New users will be automatically registered."
                  : `We sent a 6-digit code to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              {step === "email" ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}

            </CardContent>
          </Card>
          <RetroGrid className="absolute inset-0" />

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-foreground transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}

