"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Trash2, Star } from "lucide-react";
import { listReviews, setReviewApproved, deleteReview, AdminReview } from "@/lib/api/admin";
import { Paginated } from "@/lib/api/client";
import { PageHeader, Card, Select, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

export default function AdminReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Paginated<AdminReview> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const isApproved = searchParams.get("is_approved") ?? "";

  const load = useCallback(() => {
    listReviews({ is_approved: isApproved === "" ? undefined : isApproved === "true", page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load reviews."));
  }, [isApproved, page]);

  useEffect(() => {
    load();
  }, [load]);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in next)) params.delete("page");
    router.push(`/admin/reviews?${params.toString()}`);
  }

  async function handleApprove(review: AdminReview, approved: boolean) {
    setData((prev) =>
      prev ? { ...prev, results: prev.results.map((r) => (r.id === review.id ? { ...r, is_approved: approved } : r)) } : prev
    );
    try {
      await setReviewApproved(review.id, approved);
    } catch {
      load();
    }
  }

  async function handleDelete(review: AdminReview) {
    if (!confirm(`Delete this review by ${review.author}?`)) return;
    try {
      await deleteReview(review.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review.");
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" description="Approve or remove product reviews before they go live." />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="mb-4">
        <Select className="w-auto min-w-[180px]" value={isApproved} onChange={(e) => updateParams({ is_approved: e.target.value })}>
          <option value="">All reviews</option>
          <option value="false">Pending approval</option>
          <option value="true">Approved</option>
        </Select>
      </Card>

      {!data ? (
        <LoadingRows />
      ) : data.results.length === 0 ? (
        <Card>
          <EmptyState title="No reviews found" />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.results.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{review.title || "(no title)"}</p>
                    <Badge tone={review.is_approved ? "green" : "gold"}>{review.is_approved ? "Approved" : "Pending"}</Badge>
                    {review.is_verified_purchase && <Badge tone="blue">Verified purchase</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-gold-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-ink/70">{review.body}</p>
                  <p className="mt-2 text-xs text-ink/40">
                    {review.author} on {review.product_name} · {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!review.is_approved ? (
                    <button title="Approve" onClick={() => handleApprove(review, true)} className="p-2 text-emerald-600 hover:bg-emerald-50">
                      <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <button title="Unapprove" onClick={() => handleApprove(review, false)} className="p-2 text-ink/30 hover:bg-ink/5">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(review)} title="Delete" className="p-2 text-ink/30 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={(p) => updateParams({ page: String(p) })} />}
    </div>
  );
}
