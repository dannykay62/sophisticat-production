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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError("");
    try {
      await login(values.email, values.password);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/account");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Couldn't sign in. Check your details and try again."
      );
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-116px)] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16 lg:px-24">
        <Logo />
        <h1 className="mt-10 text-display-md text-ink">Welcome Back</h1>
        <p className="mt-2 text-sm text-ink/55">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
          {formError && (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>
          )}
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
                placeholder="Enter your password"
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink/60">
              <input type="checkbox" {...register("remember")} className="accent-gold-400" />
              Remember me
            </label>
            <Link href="/forgot-password" className="link-underline text-ink/60">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-stone-line" />
          <span className="text-xs uppercase tracking-wide2 text-ink/40">Or continue with</span>
          <div className="h-px flex-1 bg-stone-line" />
        </div>

        <div className="flex gap-4">
          <button type="button" className="flex flex-1 items-center justify-center gap-2 border border-stone-line py-3 text-sm text-ink transition-colors hover:border-ink">
            <GoogleIcon /> Google
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-2 border border-stone-line py-3 text-sm text-ink transition-colors hover:border-ink">
            <AppleIcon /> Apple
          </button>
        </div>

        <p className="mt-9 text-center text-sm text-ink/55">
          Don&apos;t have an account?{" "}
          <Link
            href={
              searchParams.get("next")
                ? `/register?next=${encodeURIComponent(searchParams.get("next")!)}`
                : "/register"
            }
            className="text-gold-500 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>

      <div className="relative hidden lg:block">
        <ProductImage imageKey="hero" src="/images/necklace_earing.jpg" alt="Sophisticat jewelry collection" ratio="h-screen" className="!aspect-auto object-cover" />
        {/* <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" /> */}
        <div className="absolute bottom-16 left-16">
          <span className="eyebrow-on-dark">Jewelry Collection</span>
          <h2 className="mt-3 text-display-md text-cream">Explore</h2>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.37z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink">
      <path d="M16.365 1.43c0 1.14-.417 2.15-1.25 3.02-.87.87-1.966 1.36-3.05 1.28-.13-1.11.42-2.24 1.25-3.05.87-.87 2.02-1.34 3.05-1.25zM20.16 17.32c-.44 1.02-.97 2-1.6 2.92-.86 1.24-1.56 2.1-2.1 2.6-.85.85-1.76 1.28-2.74 1.3-.7.01-1.55-.2-2.53-.63-.99-.44-1.9-.65-2.73-.65-.87 0-1.8.21-2.8.65-1 .44-1.81.67-2.43.7-.94.04-1.87-.4-2.78-1.32-.6-.55-1.34-1.44-2.22-2.68-.94-1.34-1.71-2.9-2.32-4.67-.65-1.9-.97-3.75-.97-5.55 0-2.05.45-3.82 1.34-5.3.7-1.19 1.63-2.13 2.8-2.82a7.4 7.4 0 0 1 3.78-1.08c.79 0 1.75.24 2.9.72 1.13.48 1.86.72 2.18.72.24 0 1.05-.28 2.42-.84 1.3-.52 2.4-.74 3.3-.66 2.43.2 4.26 1.15 5.47 2.87-2.17 1.32-3.25 3.16-3.23 5.53.02 1.84.68 3.37 1.98 4.6.59.56 1.25.99 1.98 1.3-.16.46-.33.9-.5 1.31z" />
    </svg>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}