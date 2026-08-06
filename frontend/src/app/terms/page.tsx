import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions" updated="June 2026">
      <p>By using the Sophisticat website and placing an order, you agree to the following terms.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Orders & Payment</h2>
      <p>All prices are listed in Nigerian Naira (&#8358;) and are subject to change without notice. Orders are confirmed once payment is successfully processed.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Product Accuracy</h2>
      <p>We make every effort to display products accurately, including colour and finish. Minor variations may occur due to screen settings and the handmade nature of some pieces.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Intellectual Property</h2>
      <p>All content on this site, including images, logos, and text, is the property of Sophisticat and may not be reproduced without permission.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Limitation of Liability</h2>
      <p>Sophisticat is not liable for indirect or consequential damages arising from the use of our products or website.</p>
      <h2 className="pt-2 font-display text-lg text-ink">Governing Law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
    </LegalPageLayout>
  );
}
