import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout title="Shipping Policy" updated="June 2026">
      <p>We currently ship across Nigeria via trusted logistics partners, with insured delivery on every order.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Delivery Times</h2>
      <p>Lagos: 1-3 working days. Other states: 3-5 working days. Remote areas may take up to 7 working days.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Shipping Fees</h2>
      <p>Orders over &#8358;100,000 ship free. Orders below that threshold incur a flat &#8358;4,990 shipping fee, calculated at checkout.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Order Tracking</h2>
      <p>Once your order ships, you&apos;ll receive a tracking number by email and SMS. Track any order at any time on our Order Tracking page.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Signature on Delivery</h2>
      <p>All orders require a signature on delivery for security. Please ensure someone is available to receive your package.</p>
    </LegalPageLayout>
  );
}
