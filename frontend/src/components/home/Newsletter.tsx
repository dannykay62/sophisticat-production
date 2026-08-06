"use client";

import { useState, FormEvent } from "react";
import { Mail } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/client";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await subscribeToNewsletter(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't subscribe right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-ink py-20">
      <div className="container-luxe flex flex-col items-center text-center">
        <Mail className="h-7 w-7 text-gold-400" strokeWidth={1.3} />
        <h2 className="mt-5 text-display-md text-cream">Stay In The Know</h2>
        <p className="mt-3 max-w-sm text-sm text-cream/55">
          Be first to hear about new arrivals, limited drops, and exclusive
          offers.
        </p>

        {submitted ? (
          <p className="mt-8 text-sm text-gold-300">
            You&apos;re on the list. Welcome to Sophisticat.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 border border-cream/25 bg-transparent px-5 py-3.5 text-sm text-cream placeholder:text-cream/35 focus:border-gold-400"
            />
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </section>
  );
}
