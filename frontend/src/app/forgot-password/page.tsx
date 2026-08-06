"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { requestPasswordReset } from "@/lib/api/auth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError("");
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch {
      // Backend always returns 200 for this endpoint (it never reveals
      // whether an email is registered), so a thrown error here means
      // something actually went wrong (network, 500, etc).
      setFormError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-116px)] flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        {sent ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <Mail className="h-10 w-10 text-gold-500" strokeWidth={1.2} />
            <h1 className="mt-5 text-display-md text-ink">Check Your Email</h1>
            <p className="mt-3 text-sm text-ink/55">
              If an account exists for that email, we&apos;ve sent a link to reset your password.
            </p>
            <Link href="/login" className="btn-primary mt-8">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-10 text-center text-display-md text-ink">Reset Password</h1>
            <p className="mt-2 text-center text-sm text-ink/55">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {formError && (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>
              )}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Email address</label>
                <input {...register("email")} type="email" className="input-luxe" placeholder="you@example.com" />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <p className="mt-8 text-center text-sm text-ink/55">
              <Link href="/login" className="text-gold-500 hover:underline">
                Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
