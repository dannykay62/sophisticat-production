"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";
import { getBlogPosts } from "@/lib/api/blog";
import { BlogPost } from "@/types";
import { cn } from "@/lib/utils";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    getBlogPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.category)))], [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, search, category]);

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
        <h1 className="mt-3 text-display-lg text-ink">Our Blog</h1>
        <p className="mt-3 max-w-md text-sm text-ink/55">
          Jewelry care, styling tips, and fabric guides from the Sophisticat edit.
        </p>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "border px-4 py-2 text-xs uppercase tracking-wide2 transition-colors",
                  category === c ? "border-gold-400 bg-gold-400 text-ink" : "border-stone-line text-ink/60 hover:border-ink"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles"
              className="input-luxe pl-10"
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-16 text-center text-sm text-ink/50">Loading articles...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-ink/50">No articles match your search.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <div className="overflow-hidden">
                  <ProductImage
                    imageKey={post.image}
                    alt={post.title}
                    src={post.imageSrc}
                    ratio="aspect-[4/3]"
                    className="transition-transform duration-700 ease-luxury group-hover:scale-105"
                  />
                </div>
                <span className="mt-4 inline-block text-[10px] uppercase tracking-wide2 text-gold-500">{post.category}</span>
                <h2 className="mt-2 font-display text-xl text-ink transition-colors group-hover:text-gold-600">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">{post.excerpt}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink/40">
                  <span>{post.date}</span>
                  <span>&middot;</span>
                  <span>{post.readTime}</span>
                </div>
                <span className="link-underline mt-3 inline-block text-xs uppercase tracking-wide2 text-ink">Read More</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
