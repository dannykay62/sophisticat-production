"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag, Wallet, Users, Mail, AlertTriangle, Star, Sparkles } from "lucide-react";
import { fetchStats, AdminStats } from "@/lib/api/admin";
import { formatNaira } from "@/lib/utils";
import { Card, PageHeader, Banner } from "./components/ui";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "ink",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href?: string;
  tone?: "ink" | "red" | "gold";
}) {
  const iconTone = tone === "red" ? "text-red-500" : tone === "gold" ? "text-gold-500" : "text-ink/50";
  const content = (
    <Card className="flex items-start justify-between transition-shadow hover:shadow-card">
      <div>
        <p className="text-xs uppercase tracking-wide2 text-ink/40">{label}</p>
        <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      </div>
      <Icon className={`h-5 w-5 ${iconTone}`} strokeWidth={1.5} />
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function RevenueChart({ series }: { series: AdminStats["revenue_series"] }) {
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const width = 700;
  const height = 220;
  const padding = 24;
  const barGap = 6;
  const barWidth = (width - padding * 2) / series.length - barGap;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue over the last 14 days">
      {series.map((d, i) => {
        const barHeight = (d.revenue / max) * (height - padding * 2);
        const x = padding + i * (barWidth + barGap);
        const y = height - padding - barHeight;
        const day = new Date(d.date).getDate();
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              fill={d.revenue > 0 ? "#A6701F" : "#E8DCCF"}
            >
              <title>
                {d.date}: {formatNaira(d.revenue)} ({d.orders} orders)
              </title>
            </rect>
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize="9" fill="#3D0B0B99">
              {day}
            </text>
          </g>
        );
      })}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E8DCCF" />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard stats."));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of how the store is doing." />

      {error && <Banner tone="error">{error}</Banner>}

      {!stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-ink/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Revenue (paid orders)" value={formatNaira(stats.total_revenue)} tone="gold" />
            <StatCard icon={ShoppingBag} label="Total orders" href="/admin/orders" value={stats.total_orders} />
            <StatCard
              icon={ShoppingBag}
              label="Processing"
              href="/admin/orders?status=processing"
              value={stats.processing_orders}
            />
            <StatCard icon={Package} label="Active products" href="/admin/products" value={stats.total_products} />
            <StatCard
              icon={Sparkles}
              label="Featured products"
              href="/admin/products?featured=true"
              value={stats.featured_products}
              tone="gold"
            />
            <StatCard
              icon={AlertTriangle}
              label="Low stock (≤10)"
              href="/admin/products?low_stock=true"
              value={stats.low_stock}
              tone="red"
            />
            <StatCard icon={Users} label="Customers" href="/admin/customers" value={stats.total_customers} />
            <StatCard
              icon={Mail}
              label="Unread messages"
              href="/admin/messages?is_resolved=false"
              value={stats.unread_messages}
              tone="red"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <p className="mb-4 text-xs uppercase tracking-wide2 text-ink/40">Revenue — last 14 days</p>
              <RevenueChart series={stats.revenue_series} />
            </Card>

            <Card>
              <p className="mb-4 text-xs uppercase tracking-wide2 text-ink/40">Top-selling products</p>
              {stats.top_products.length === 0 ? (
                <p className="text-sm text-ink/40">No sales yet.</p>
              ) : (
                <ol className="space-y-3">
                  {stats.top_products.map((p, i) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <Link href={`/admin/products`} className="flex items-center gap-2 truncate text-ink/80 hover:text-ink">
                        <span className="text-ink/30">{i + 1}.</span>
                        <span className="truncate">{p.name}</span>
                      </Link>
                      <span className="shrink-0 text-ink/50">{p.units_sold} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/admin/reviews?is_approved=false">
              <Card className="flex items-center gap-3 hover:shadow-card">
                <Star className="h-5 w-5 text-gold-500" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink">{stats.pending_reviews} reviews pending</p>
                  <p className="text-xs text-ink/40">Review before they go live</p>
                </div>
              </Card>
            </Link>
            <Card className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-ink/50" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-ink">{stats.newsletter_subscribers} newsletter subscribers</p>
                <p className="text-xs text-ink/40">Total signed up</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
