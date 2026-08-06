"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import { listBlogPosts, deleteBlogPost, AdminBlogPost } from "@/lib/api/admin";
import { Paginated } from "@/lib/api/client";
import { PageHeader, Card, Button, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

export default function AdminBlogPage() {
  const [data, setData] = useState<Paginated<AdminBlogPost> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    listBlogPosts({ page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load blog posts."));
  }

  useEffect(load, [page]);

  async function handleDelete(post: AdminBlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      await deleteBlogPost(post.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Manage blog posts shown on the storefront's journal."
        action={
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4" /> New post
            </Button>
          </Link>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="overflow-x-auto p-0">
        {!data ? (
          <LoadingRows />
        ) : data.results.length === 0 ? (
          <EmptyState title="No posts yet" description="Publish your first blog post." />
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((post) => (
                <tr key={post.id} className="border-b border-stone-line/70 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-ink/5">
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-ink/20" />
                        )}
                      </div>
                      <p className="max-w-xs truncate font-medium text-ink">{post.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{post.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone={post.is_published ? "green" : "neutral"}>{post.is_published ? "Published" : "Draft"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{new Date(post.published_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/blog/${post.id}`} title="Edit" className="p-2 text-ink/50 hover:bg-ink/5 hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(post)} title="Delete" className="p-2 text-ink/30 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={setPage} />}
    </div>
  );
}
