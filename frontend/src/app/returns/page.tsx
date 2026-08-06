import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Returns & Refunds" };

export default function ReturnsPage() {
  return (
    <LegalPageLayout title="Returns & Refunds" updated="June 2026">
      <p>We want you to love every piece. If something isn&apos;t right, we accept returns within 14 days of delivery.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Eligibility</h2>
      <p>Items must be unworn, unused, and returned in their original packaging with tags attached. For hygiene reasons, opened or worn beaded items cannot be returned unless faulty.</p>
      <h2 className="pt-2 font-display text-lg text-ink">How to Start a Return</h2>
      <p>Email hello@shopsophisticat.com with your order number and reason for return. We&apos;ll issue a return authorization and pickup instructions within 24 hours.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Refunds</h2>
      <p>Once we receive and inspect your return, refunds are processed to your original payment method within 5-7 working days.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Exchanges</h2>
      <p>Need a different size or piece? Let us know when you request your return and we&apos;ll prioritise your exchange.</p>
    </LegalPageLayout>
  );
}
