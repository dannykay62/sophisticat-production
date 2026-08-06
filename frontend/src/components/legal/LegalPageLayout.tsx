import Breadcrumb from "@/components/ui/Breadcrumb";

export default function LegalPageLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe max-w-2xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
        <h1 className="mt-3 text-display-lg text-ink">{title}</h1>
        {updated && <p className="mt-2 text-xs text-ink/40">Last updated: {updated}</p>}
        <div className="prose-luxe mt-8 space-y-5 text-sm leading-relaxed text-ink/65">{children}</div>
      </div>
    </section>
  );
}
