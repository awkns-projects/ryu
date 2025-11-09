"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoAuth } from "@/contexts/go-auth-context";

type RegisterStep = "register" | "setup-otp" | "verify-otp";

export default function PasswordRegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { register, completeRegistration } = useGoAuth();
  const [step, setStep] = useState<RegisterStep>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [betaCode, setBetaCode] = useState("");
  const [betaMode, setBetaMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [userID, setUserID] = useState("");
  const [otpSecret, setOtpSecret] = useState("");
  const [qrCodeURL, setQrCodeURL] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch system config to check if beta mode is enabled
    fetch("/api/go/auth/system-config")
      .then((res) => res.json())
      .then((config) => {
        setBetaMode(config.beta_mode || false);
      })
      .catch((err) => {
        console.error("Failed to fetch system config:", err);
      });
  }, []);

  useEffect(() => {
    // Validate password strength
    const isValid = isStrongPassword(password) && password === confirmPassword;
    setPasswordValid(isValid);
  }, [password, confirmPassword]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation: length>=8, includes upper/lower case, numbers, special chars, and both match
    const strong = isStrongPassword(password);
    if (!strong || password !== confirmPassword) {
      setError("Password does not meet requirements or passwords do not match");
      return;
    }

    if (betaMode && !betaCode.trim()) {
      setError("Beta code is required during beta period");
      return;
    }

    setLoading(true);

    const result = await register(email, password, betaCode.trim() || undefined);

    if (result.success && result.userID) {
      setUserID(result.userID);
      setOtpSecret(result.otpSecret || "");
      setQrCodeURL(result.qrCodeURL || "");
      setStep("setup-otp");
    } else {
      setError(result.message || "Registration failed");
    }

    setLoading(false);
  };

  const handleSetupComplete = () => {
    setStep("verify-otp");
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await completeRegistration(userID, otpCode);

    if (result.success) {
      // Get redirect path from URL params or default to home
      const redirectTo = searchParams.get("redirect") || `/${locale}`;
      router.push(redirectTo);
      router.refresh();
    } else {
      setError(result.message || "Registration failed");
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              {step === "register" && "Create Your Account"}
              {step === "setup-otp" && "Setup Two-Factor Authentication"}
              {step === "verify-otp" && "Verify Your Account"}
            </h1>
            <p className="text-sm mt-2 text-[#848E9C]">
              {step === "register" && "Register to get started with Ryu"}
              {step === "setup-otp" &&
                "Secure your account with two-factor authentication"}
              {step === "verify-otp" &&
                "Enter the code from your authenticator app"}
            </p>
          </div>

          {/* Registration Form */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "#181A20",
              border: "1px solid #2B3139",
            }}
          >
            {step === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
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
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
                    Confirm Password
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
                      met={password.length >= 8}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={/[A-Z]/.test(password)}
                      text="Contains uppercase letter"
                    />
                    <PasswordRequirement
                      met={/[a-z]/.test(password)}
                      text="Contains lowercase letter"
                    />
                    <PasswordRequirement
                      met={/\d/.test(password)}
                      text="Contains number"
                    />
                    <PasswordRequirement
                      met={/[@#$%!&*?]/.test(password)}
                      text="Contains special character (@#$%!&*?)"
                    />
                    <PasswordRequirement
                      met={password === confirmPassword && password.length > 0}
                      text="Passwords match"
                    />
                  </ul>
                </div>

                {betaMode && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
                      Beta Code *
                    </label>
                    <input
                      type="text"
                      value={betaCode}
                      onChange={(e) =>
                        setBetaCode(
                          e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase()
                        )
                      }
                      className="w-full px-3 py-2 rounded font-mono bg-[#0B0E11] border border-[#2B3139] text-[#EAECEF] focus:outline-none focus:border-[#F0B90B]"
                      placeholder="Enter 6-digit beta code"
                      maxLength={6}
                      required={betaMode}
                    />
                    <p className="text-xs mt-1 text-[#848E9C]">
                      Beta code consists of 6 alphanumeric characters
                    </p>
                  </div>
                )}

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
                  disabled={
                    loading || (betaMode && !betaCode.trim()) || !passwordValid
                  }
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: "#F0B90B",
                    color: "#000",
                  }}
                >
                  {loading ? "Loading..." : "Register"}
                </button>
              </form>
            )}

            {step === "setup-otp" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <h3 className="text-lg font-semibold mb-2 text-[#EAECEF]">
                    Setup Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-[#848E9C]">
                    Secure your account with an authenticator app
                  </p>
                </div>

                <div className="space-y-3">
                  <div
                    className="p-3 rounded"
                    style={{
                      background: "#0B0E11",
                      border: "1px solid #2B3139",
                    }}
                  >
                    <p className="text-sm font-semibold mb-2 text-[#EAECEF]">
                      Step 1: Download an Authenticator App
                    </p>
                    <p className="text-xs text-[#848E9C]">
                      Download Google Authenticator, Authy, or any TOTP-compatible
                      app
                    </p>
                  </div>

                  <div
                    className="p-3 rounded"
                    style={{
                      background: "#0B0E11",
                      border: "1px solid #2B3139",
                    }}
                  >
                    <p className="text-sm font-semibold mb-2 text-[#EAECEF]">
                      Step 2: Scan QR Code
                    </p>
                    <p className="text-xs mb-2 text-[#848E9C]">
                      Open your authenticator app and scan this QR code
                    </p>

                    {qrCodeURL && (
                      <div className="mt-2">
                        <p className="text-xs mb-2 text-[#848E9C]">
                          Scan this QR code with your authenticator app:
                        </p>
                        <div className="bg-white p-2 rounded text-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              qrCodeURL
                            )}`}
                            alt="QR Code"
                            className="mx-auto"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-2">
                      <p className="text-xs mb-1 text-[#848E9C]">
                        Or enter this secret key manually:
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 px-2 py-1 text-xs rounded font-mono bg-[#2B3139] text-[#EAECEF]"
                        >
                          {otpSecret}
                        </code>
                        <button
                          onClick={() => copyToClipboard(otpSecret)}
                          className="px-2 py-1 text-xs rounded flex items-center gap-1"
                          style={{
                            background: "#F0B90B",
                            color: "#000",
                          }}
                        >
                          {copied ? (
                            <>
                              <Check size={14} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded"
                    style={{
                      background: "#0B0E11",
                      border: "1px solid #2B3139",
                    }}
                  >
                    <p className="text-sm font-semibold mb-2 text-[#EAECEF]">
                      Step 3: Verify Your Setup
                    </p>
                    <p className="text-xs text-[#848E9C]">
                      Click continue to enter the verification code
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSetupComplete}
                  className="w-full px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: "#F0B90B", color: "#000" }}
                >
                  Continue to Verification
                </button>
              </div>
            )}

            {step === "verify-otp" && (
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🔐</div>
                  <p className="text-sm text-[#848E9C]">
                    Enter the 6-digit code from your authenticator app
                    <br />
                    to complete registration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#EAECEF]">
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
                    onClick={() => setStep("setup-otp")}
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
                    {loading ? "Loading..." : "Complete Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Login Link */}
          {step === "register" && (
            <div className="text-center mt-6">
              <p className="text-sm text-[#848E9C]">
                Already have an account?{" "}
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

