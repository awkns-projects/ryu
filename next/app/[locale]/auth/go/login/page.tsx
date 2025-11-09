"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoAuth } from "@/contexts/go-auth-context";

type LoginStep = "login" | "otp";

export default function PasswordLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login, verifyOTP } = useGoAuth();
  const [step, setStep] = useState<LoginStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userID, setUserID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.requiresOTP && result.userID) {
        // OTP required - show OTP step
        setUserID(result.userID);
        setStep("otp");
        setLoading(false);
      } else {
        // Login successful without OTP - redirect
        console.log('✅ Login: Authenticated without OTP');
        
        const redirectTo = searchParams.get("redirect") || `/${locale}`;
        console.log('🔀 Login: Preparing redirect to', redirectTo);
        
        // Use setTimeout to ensure state updates propagate
        setTimeout(() => {
          console.log('🚀 Login: Executing redirect...');
          router.push(redirectTo);
        }, 150);
        
        // Keep loading state while redirecting
        return;
      }
    } else {
      setError(result.message || "Login failed");
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verifyOTP(userID, otpCode);

    if (result.success) {
      console.log('✅ Login: OTP verified successfully');
      
      // Get redirect path from URL params or default to home
      const redirectTo = searchParams.get("redirect") || `/${locale}`;
      console.log('🔀 Login: Preparing redirect to', redirectTo);
      
      // Use setTimeout to ensure:
      // 1. localStorage write completes
      // 2. React state updates propagate
      // 3. Auth context initializes on next page
      setTimeout(() => {
        console.log('🚀 Login: Executing redirect...');
        router.push(redirectTo);
      }, 150);
      
      // Keep loading state while redirecting
      return;
    } else {
      setError(result.message || "OTP verification failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11]">
      {/* Header */}
      <header className="border-b border-[#1E2329] bg-[#0B0E11]/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Ryu Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold text-[#EAECEF]">Ryu</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}`} className="flex items-center gap-2 text-[#848E9C] hover:text-[#EAECEF]">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div
        className="flex items-center justify-center pt-20"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <div className="w-full max-w-md px-4">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Ryu Logo"
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#EAECEF]">
              Login to Ryu
            </h1>
            <p className="text-sm mt-2 text-[#848E9C]">
              {step === "login"
                ? "Please enter your email and password"
                : "Please enter your two-factor authentication code"}
            </p>
          </div>

          {/* Login Form */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "#181A20",
              border: "1px solid #2B3139",
            }}
          >
            {step === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2 text-[#EAECEF]"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded px-3 py-2 text-sm bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-2 text-[#EAECEF]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-10 w-full rounded px-3 py-2 pr-10 text-sm bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 w-8 h-10 flex items-center justify-center rounded bg-transparent p-0 m-0 border-0 outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer text-[#848E9C] hover:text-[#EAECEF]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="text-right mt-2">
                    <Link
                      href={`/${locale}/auth/go/reset-password`}
                      className="text-xs hover:underline text-[#F0B90B]"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {error && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{
                      background: "rgba(246, 70, 93, 0.1)",
                      color: "#F6465D",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: "#F0B90B",
                    color: "#000",
                  }}
                >
                  {loading ? "Loading..." : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm text-[#848E9C]">
                    Open your two-factor authentication app
                    <br />
                    and enter the code
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-2 text-[#EAECEF]"
                  >
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full px-3 py-2 rounded text-center text-2xl font-mono bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                {error && (
                  <div
                    className="text-sm px-3 py-2 rounded"
                    style={{
                      background: "rgba(246, 70, 93, 0.1)",
                      color: "#F6465D",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("login")}
                    className="flex-1 px-4 py-2 rounded text-sm font-semibold bg-[#2B3139] text-[#848E9C] hover:bg-[#2B3139]/80"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="flex-1 px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "#F0B90B", color: "#000" }}
                  >
                    {loading ? "Loading..." : "Verify OTP"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-[#848E9C]">
              Don't have an account?{" "}
              <Link
                href={`/${locale}/auth/go/register`}
                className="font-semibold hover:underline transition-colors text-[#F0B90B]"
              >
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

