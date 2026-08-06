import { apiFetch } from "./client";
import { BlogPost } from "@/types";

interface ApiBlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  read_time: string;
  published_at: string;
}

interface ApiBlogPostDetail extends ApiBlogPostListItem {
  content: string[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" });
}

function normalizeListItem(item: ApiBlogPostListItem): BlogPost {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    image: "blog",
    imageSrc: item.image,
    date: formatDate(item.published_at),
    category: item.category,
    readTime: item.read_time,
    content: [],
  };
}

function normalizeDetail(item: ApiBlogPostDetail): BlogPost {
  return { ...normalizeListItem(item), content: item.content };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const items = await apiFetch<ApiBlogPostListItem[]>("/blog/", { auth: false, cache: "no-store" });
  return items.map(normalizeListItem);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const item = await apiFetch<ApiBlogPostDetail>(`/blog/${slug}/`, { auth: false, cache: "no-store" });
    return normalizeDetail(item);
  } catch {
    return null;
  }
}
