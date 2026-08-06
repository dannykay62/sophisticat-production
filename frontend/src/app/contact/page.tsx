"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import FAQAccordion from "@/components/ui/FAQAccordion";
import { faqs } from "@/lib/data";
import { submitContactMessage } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/client";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(2, "Enter a subject"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type ContactValues = z.infer<typeof contactSchema>;

const HOURS = [
  { day: "Monday - Friday", time: "9:00 AM - 7:00 PM" },
  { day: "Saturday", time: "10:00 AM - 6:00 PM" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactValues) {
    setSubmitError("");
    try {
      await submitContactMessage(values);
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't send your message. Please try again.");
    }
  }

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="mt-3 text-display-lg text-ink">Get In Touch</h1>
        <p className="mt-3 max-w-md text-sm text-ink/55">
          Questions about an order, a piece, or a partnership? We&apos;d love to hear from you.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-[1fr_420px]">
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {submitError && (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
              )}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Your Name</label>
                  <input {...register("name")} className="input-luxe" placeholder="Full name" />
                  {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Email Address</label>
                  <input {...register("email")} type="email" className="input-luxe" placeholder="you@example.com" />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Subject</label>
                <input {...register("subject")} className="input-luxe" placeholder="How can we help?" />
                {errors.subject && <p className="mt-1.5 text-xs text-red-500">{errors.subject.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Message</label>
                <textarea {...register("message")} rows={6} className="input-luxe resize-none" placeholder="Tell us more..." />
                {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
                {isSubmitting ? "Sending..." : submitted ? "Message Sent ✓" : "Send Message"}
              </button>
            </form>

            <div className="mt-16">
              <h2 className="font-display text-xl text-ink">Frequently Asked Questions</h2>
              <div className="mt-6">
                <FAQAccordion items={faqs} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-5 border border-stone-line bg-cream-deep p-8">
              {[
                { icon: MapPin, label: "Showroom", value: "1337 W Devon Avenue Chicago II 60625" },
                { icon: Phone, label: "Phone", value: "+234 803 123 4567" },
                { icon: Mail, label: "Email", value: "hello@sophisticat.com" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold-500" strokeWidth={1.4} />
                  <div>
                    <p className="text-xs uppercase tracking-wide2 text-ink/45">{label}</p>
                    <p className="mt-0.5 text-sm text-ink/75">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-stone-line bg-cream-deep p-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-gold-500" strokeWidth={1.4} />
                <h3 className="text-xs uppercase tracking-wide2 text-ink/45">Business Hours</h3>
              </div>
              <div className="mt-4 space-y-2.5">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm text-ink/70">
                    <span>{h.day}</span>
                    <span>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=14+Adeola+Odeku+Street+Victoria+Island+Lagos"
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-[4/3] overflow-hidden border border-stone-line"
            >
              <div className="absolute inset-0 bg-ink">
                <svg className="h-full w-full opacity-30" viewBox="0 0 400 300">
                  <defs>
                    <pattern id="mapgrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#C9A24B" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="300" fill="url(#mapgrid)" />
                  <path d="M0 120 Q100 80 200 130 T400 110" stroke="#C9A24B" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <path d="M0 200 Q150 240 250 190 T400 210" stroke="#C9A24B" strokeWidth="1.5" fill="none" opacity="0.5" />
                </svg>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <MapPin className="h-8 w-8 fill-gold-400 text-ink" strokeWidth={1} />
                <p className="text-xs uppercase tracking-wide2 text-cream">Victoria Island, Lagos</p>
                <span className="link-underline text-[11px] text-gold-300">Get Directions</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
