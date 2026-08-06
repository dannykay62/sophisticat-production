"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { confirmPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError("");
    if (!uid || !token) {
      setFormError("This reset link is invalid. Please request a new one.");
      return;
    }
    try {
      await confirmPasswordReset(uid, token, values.password);
      setDone(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "This reset link is invalid or has expired. Please request a new one."
      );
    }
  }

  if (!uid || !token) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <h1 className="text-display-md text-ink">Invalid Link</h1>
        <p className="mt-3 text-sm text-ink/55">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-8">
          Request New Link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <CheckCircle2 className="h-10 w-10 text-gold-500" strokeWidth={1.2} />
        <h1 className="mt-5 text-display-md text-ink">Password Reset</h1>
        <p className="mt-3 text-sm text-ink/55">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <button className="btn-primary mt-8" onClick={() => router.push("/login")}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="mt-10 text-center text-display-md text-ink">Set New Password</h1>
      <p className="mt-2 text-center text-sm text-ink/55">Choose a new password for your account.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {formError && (
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>
        )}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">New password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="input-luxe pr-11"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Confirm password</label>
          <input
            {...register("confirmPassword")}
            type={showPassword ? "text" : "password"}
            className="input-luxe"
            placeholder="Re-enter your new password"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-116px)] flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
