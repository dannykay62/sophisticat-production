import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/api/blog";

// No generateStaticParams here on purpose — blog posts now live in the
// database and can be added/edited from the admin at any time, so this
// route renders dynamically per-request instead of being frozen at build.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getBlogPosts();
  const related = allPosts.filter((p) => p.id !== post.id).slice(0, 2);

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe max-w-3xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

        <span className="mt-6 inline-block text-[10px] uppercase tracking-wide2 text-gold-500">{post.category}</span>
        <h1 className="mt-2 text-display-lg text-ink">{post.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
          <span>{post.date}</span>
          <span>&middot;</span>
          <span>{post.readTime}</span>
        </div>

        <div className="mt-8 overflow-hidden">
          <ProductImage imageKey={post.image} alt={post.title} src={post.imageSrc} ratio="aspect-[16/9]" />
        </div>

        <div className="mt-10 space-y-5 text-sm leading-relaxed text-ink/65">
          {post.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t border-stone-line pt-10">
            <h2 className="font-display text-xl text-ink">More From The Journal</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group flex items-center gap-4">
                  <div className="w-20 shrink-0 overflow-hidden">
                    <ProductImage imageKey={r.image} alt={r.title} src={r.imageSrc} ratio="aspect-square" />
                  </div>
                  <div>
                    <p className="text-sm text-ink transition-colors group-hover:text-gold-600">{r.title}</p>
                    <span className="mt-1 flex items-center gap-1 text-xs text-ink/40">
                      Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
