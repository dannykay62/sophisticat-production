"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, updateBlogPost, AdminBlogPost } from "@/lib/api/admin";
import { Card, Field, Input, Textarea, Button, Banner } from "../components/ui";

export default function BlogPostForm({ post }: { post?: AdminBlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [readTime, setReadTime] = useState(post?.read_time ?? "5 min read");
  const [isPublished, setIsPublished] = useState(post?.is_published ?? true);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState(post?.image ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { title, excerpt, content, category, read_time: readTime, is_published: isPublished, image: imageFile };
    try {
      if (isEdit) await updateBlogPost(post!.id, payload);
      else {
        if (!imageFile) throw new Error("Please choose a cover image.");
        await createBlogPost(payload);
      }
      router.push("/manage/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}

      <Card className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Styling Tips" />
          </Field>
          <Field label="Read time">
            <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Excerpt">
          <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required maxLength={300} />
        </Field>
        <Field label="Content (one paragraph per line)">
          <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} required />
        </Field>
      </Card>

      <Card>
        <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Cover image</p>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mb-3 h-40 w-full max-w-sm object-cover" />
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </Card>

      <Card>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          Published (visible on storefront)
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Publish post"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/manage/blog")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


