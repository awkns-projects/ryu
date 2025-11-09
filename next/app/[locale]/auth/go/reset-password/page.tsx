"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoAuth } from "@/contexts/go-auth-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const { resetPassword } = useGoAuth();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  useEffect(() => {
    // Validate password strength
    const isValid =
      isStrongPassword(newPassword) && newPassword === confirmPassword;
    setPasswordValid(isValid);
  }, [newPassword, confirmPassword]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordValid) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);

    const result = await resetPassword(email, newPassword, otpCode);

    if (result.success) {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/go/login`);
      }, 3000);
    } else {
      setError(result.message || "Password reset failed");
    }

    setLoading(false);
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
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 text-[#848E9C] hover:text-[#EAECEF]"
            >
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
          {/* Back to Login */}
          <Link
            href={`/${locale}/auth/go/login`}
            className="flex items-center gap-2 mb-6 text-sm hover:text-[#F0B90B] transition-colors text-[#848E9C]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{ background: "rgba(240, 185, 11, 0.1)" }}
            >
              <KeyRound className="w-8 h-8" style={{ color: "#F0B90B" }} />
            </div>
            <h1 className="text-2xl font-bold text-[#EAECEF]">
              Reset Your Password
            </h1>
            <p className="text-sm mt-2 text-[#848E9C]">
              Use your email and authenticator app to reset your password
            </p>
          </div>

          {/* Reset Password Form */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "#181A20",
              border: "1px solid #2B3139",
            }}
          >
            {success ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-semibold mb-2 text-[#EAECEF]">
                  Password Reset Successful!
                </p>
                <p className="text-sm text-[#848E9C]">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
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
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex h-10 w-full rounded px-3 py-2 pr-10 text-sm bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 w-8 h-10 flex items-center justify-center rounded bg-transparent p-0 m-0 border-0 outline-none focus:outline-none focus:ring-0 appearance-none cursor-pointer text-[#848E9C] hover:text-[#EAECEF]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="mt-1 text-xs text-[#848E9C]">
                  <div className="mb-1 text-[#EAECEF]">Password requirements:</div>
                  <ul className="space-y-1">
                    <PasswordRequirement
                      met={newPassword.length >= 8}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={/[A-Z]/.test(newPassword)}
                      text="Contains uppercase letter"
                    />
                    <PasswordRequirement
                      met={/[a-z]/.test(newPassword)}
                      text="Contains lowercase letter"
                    />
                    <PasswordRequirement
                      met={/\d/.test(newPassword)}
                      text="Contains number"
                    />
                    <PasswordRequirement
                      met={/[@#$%!&*?]/.test(newPassword)}
                      text="Contains special character (@#$%!&*?)"
                    />
                    <PasswordRequirement
                      met={
                        newPassword === confirmPassword && newPassword.length > 0
                      }
                      text="Passwords match"
                    />
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
                    Authenticator Code
                  </label>
                  <div className="text-center mb-3">
                    <div className="text-3xl">📱</div>
                    <p className="text-xs mt-1 text-[#848E9C]">
                      Open your authenticator app and enter the 6-digit code
                    </p>
                  </div>
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

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6 || !passwordValid}
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "#F0B90B", color: "#000" }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>

          {/* Login Link */}
          {!success && (
            <div className="text-center mt-6">
              <p className="text-sm text-[#848E9C]">
                Remember your password?{" "}
                <Link
                  href={`/${locale}/auth/go/login`}
                  className="font-semibold hover:underline transition-colors text-[#F0B90B]"
                >
                  Login now
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-1">
      <span className={met ? "text-green-500" : "text-[#848E9C]"}>
        {met ? "✓" : "○"}
      </span>
      <span className={met ? "text-green-500" : "text-[#848E9C]"}>{text}</span>
    </li>
  );
}

// Password strength validation function
function isStrongPassword(pwd: string): boolean {
  if (!pwd || pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = /[@#$%!&*?]/.test(pwd);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

