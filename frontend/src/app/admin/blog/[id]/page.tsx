"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchBlogPost, AdminBlogPost } from "@/lib/api/admin";
import { PageHeader, Banner, LoadingRows } from "../../components/ui";
import BlogPostForm from "../BlogPostForm";

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogPost(params.id)
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load post."));
  }, [params.id]);

  return (
    <div>
      <PageHeader title="Edit blog post" description={post?.title} />
      {error && <Banner tone="error">{error}</Banner>}
      {!post && !error ? <LoadingRows /> : post ? <BlogPostForm post={post} /> : null}
    </div>
  );
}
