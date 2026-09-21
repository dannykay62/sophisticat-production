"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Trash2, Mail, MailOpen } from "lucide-react";
import { listMessages, resolveMessage, deleteMessage, AdminContactMessage } from "@/lib/api/admin";
import { Paginated } from "@/lib/api/client";
import { PageHeader, Card, Select, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

export default function AdminMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Paginated<AdminContactMessage> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const isResolved = searchParams.get("is_resolved") ?? "";

  const load = useCallback(() => {
    listMessages({ is_resolved: isResolved === "" ? undefined : isResolved === "true", page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages."));
  }, [isResolved, page]);

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
    router.push(`/manage/messages?${params.toString()}`);
  }

  async function handleResolve(msg: AdminContactMessage) {
    setData((prev) =>
      prev ? { ...prev, results: prev.results.map((m) => (m.id === msg.id ? { ...m, is_resolved: !m.is_resolved } : m)) } : prev
    );
    try {
      await resolveMessage(msg.id, !msg.is_resolved);
    } catch {
      load();
    }
  }

  async function handleDelete(msg: AdminContactMessage) {
    if (!confirm(`Delete message from ${msg.name}?`)) return;
    try {
      await deleteMessage(msg.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message.");
    }
  }

  return (
    <div>
      <PageHeader title="Messages" description="Contact form submissions from customers." />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="mb-4">
        <Select className="w-auto min-w-[180px]" value={isResolved} onChange={(e) => updateParams({ is_resolved: e.target.value })}>
          <option value="">All messages</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </Select>
      </Card>

      {!data ? (
        <LoadingRows />
      ) : data.results.length === 0 ? (
        <Card>
          <EmptyState title="No messages" description="You're all caught up." />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.results.map((msg) => (
            <Card key={msg.id} className={!msg.is_resolved ? "border-l-4 border-l-gold-500" : undefined}>
              <div className="flex items-start justify-between gap-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>
                  <div className="flex items-center gap-2">
                    {msg.is_resolved ? (
                      <MailOpen className="h-4 w-4 shrink-0 text-ink/30" />
                    ) : (
                      <Mail className="h-4 w-4 shrink-0 text-gold-500" />
                    )}
                    <p className="truncate font-medium text-ink">{msg.subject || "(no subject)"}</p>
                    <Badge tone={msg.is_resolved ? "neutral" : "gold"}>{msg.is_resolved ? "Resolved" : "New"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {msg.name} · {msg.email}
                  </p>
                  <p className={`mt-2 text-sm text-ink/70 ${expanded === msg.id ? "" : "line-clamp-2"}`}>{msg.message}</p>
                  <p className="mt-2 text-xs text-ink/40">{new Date(msg.created_at).toLocaleString()}</p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    title={msg.is_resolved ? "Mark unresolved" : "Mark resolved"}
                    onClick={() => handleResolve(msg)}
                    className={`p-2 hover:bg-ink/5 ${msg.is_resolved ? "text-emerald-600" : "text-ink/30"}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(msg)} title="Delete" className="p-2 text-ink/30 hover:bg-red-50 hover:text-red-600">
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


