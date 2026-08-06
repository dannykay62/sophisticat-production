import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="June 2026">
      <p>Sophisticat respects your privacy. This policy explains what data we collect and how it&apos;s used.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Information We Collect</h2>
      <p>Name, email, phone number, and delivery address when you create an account or place an order. Payment details are processed securely by Stripe or Paystack and never stored on our servers.</p>
      <h2 className="pt-2 font-display text-lg text-ink">How We Use Your Data</h2>
      <p>To process orders, provide customer support, and — with your consent — send updates about new arrivals and promotions.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Your Rights</h2>
      <p>You may request access to, correction of, or deletion of your personal data at any time by emailing hello@shopsophisticat.com.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Cookies</h2>
      <p>We use cookies to keep you signed in and remember items in your bag. You can disable cookies in your browser settings.</p>
    </LegalPageLayout>
  );
}
