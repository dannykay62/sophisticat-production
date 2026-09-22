"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ProductImage from "@/components/ui/ProductImage";
import { useAuthStore } from "@/lib/store/authStore";
import { ApiError } from "@/lib/api/client";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    agree: z.boolean().refine((v) => v === true, "You must accept the Terms & Conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : null;
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setFormError("");
    try {
      await registerUser(values.fullName, values.email, values.password, values.confirmPassword);
      router.push(safeNext ?? "/account");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Couldn't create your account. Please try again."
      );
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-116px)] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <ProductImage imageKey="jewelry" src="/images/sophisticat_hero.png" alt="Sophisticat jewelry collection" ratio="h-full" className="!aspect-auto" />
        {/* <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" /> */}
        <div className="absolute bottom-16 left-16">
          <span className="eyebrow-on-dark">Jewelry Collection</span>
          <h2 className="mt-3 text-display-md text-cream">Sign Up To Join Us</h2>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-16 lg:px-24">
        <Logo />
        <h1 className="mt-10 text-display-md text-ink">Create Account</h1>
        <p className="mt-2 text-sm text-ink/55">Join Sophisticat for early access to new drops</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
          {formError && (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>
          )}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Full Name</label>
            <input {...register("fullName")} className="input-luxe" placeholder="Adaeze Okafor" />
            {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Email address</label>
            <input {...register("email")} type="email" className="input-luxe" placeholder="you@example.com" />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="input-luxe pr-11"
                placeholder="Create a password"
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
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Confirm Password</label>
            <input {...register("confirmPassword")} type="password" className="input-luxe" placeholder="Re-enter your password" />
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-sm text-ink/60">
              <input type="checkbox" {...register("agree")} className="mt-0.5 accent-gold-400" />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-gold-500 hover:underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-gold-500 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agree && <p className="mt-1.5 text-xs text-red-500">{errors.agree.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-9 text-center text-sm text-ink/55">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}


export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}