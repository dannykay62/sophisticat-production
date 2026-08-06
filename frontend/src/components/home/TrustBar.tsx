import { ShieldCheck, Truck, Lock, HeadphonesIcon } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Authentic Products", subtitle: "100% Genuine" },
  { icon: Truck, title: "Lagos-Wide Delivery", subtitle: "1-3 Working Days" },
  { icon: Lock, title: "Secure Payments", subtitle: "Safe & Protected" },
  { icon: HeadphonesIcon, title: "Dedicated Support", subtitle: "We're Here For You" },
];

export default function TrustBar() {
  return (
    <section className="bg-ink">
      <div className="container-luxe grid grid-cols-2 gap-6 py-8 md:grid-cols-4 md:gap-4">
        {ITEMS.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="h-6 w-6 shrink-0 text-gold-400" strokeWidth={1.3} />
            <div>
              <p className="text-xs uppercase tracking-wide2 text-cream">{title}</p>
              <p className="text-[11px] text-cream/45">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
