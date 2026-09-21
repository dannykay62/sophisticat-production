"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { listCustomers, AdminCustomer } from "@/lib/api/admin";
import { Paginated } from "@/lib/api/client";
import { PageHeader, Card, Input, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

export default function AdminCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Paginated<AdminCustomer> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const page = Number(searchParams.get("page") ?? "1");

  const load = useCallback(() => {
    listCustomers({ search: searchParams.get("search") ?? undefined, page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load customers."));
  }, [searchParams, page]);

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
    router.push(`/manage/customers?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader title="Customers" description="Everyone with an account on the storefront." />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="mb-4">
        <form
          className="relative max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        {!data ? (
          <LoadingRows />
        ) : data.results.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((customer) => (
                <tr key={customer.id} className="border-b border-stone-line/70 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{customer.full_name || "—"}</p>
                    <p className="text-xs text-ink/40">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{customer.order_count}</td>
                  <td className="px-4 py-3 text-ink/50">{new Date(customer.date_joined).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={customer.is_active ? "green" : "red"}>{customer.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={(p) => updateParams({ page: String(p) })} />}
    </div>
  );
}


