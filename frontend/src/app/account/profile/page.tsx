"use client";

import { useState } from "react";
import { Bell, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function AccountDetailsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    date_of_birth: user?.date_of_birth ?? "",
  });
  const [notifications, setNotifications] = useState({
    notify_order_updates: user?.notify_order_updates ?? true,
    notify_promotions: user?.notify_promotions ?? true,
    notify_new_arrivals: user?.notify_new_arrivals ?? false,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const updated = await authApi.updateMe({ ...profile, ...notifications });
      setUser(updated);
      setProfileMessage("Saved ✓");
      setTimeout(() => setProfileMessage(""), 2500);
    } catch {
      setProfileMessage("Couldn't save changes. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(passwords.current, passwords.next);
      setPasswordMessage("Password updated ✓");
      setPasswords({ current: "", next: "" });
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-display-md text-ink">Account Details</h1>
        <p className="mt-2 text-sm text-ink/55">Manage your profile information and preferences.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <h2 className="eyebrow">Profile Information</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">First Name</label>
            <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="input-luxe" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Last Name</label>
            <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="input-luxe" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Email Address</label>
            <input value={user?.email ?? ""} disabled className="input-luxe opacity-60" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Phone Number</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-luxe" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">Date of Birth</label>
            <input
              type="date"
              value={profile.date_of_birth ?? ""}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="input-luxe"
            />
          </div>
        </div>

        <div className="border-t border-stone-line pt-8">
          <h2 className="eyebrow mb-5 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" /> Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              { key: "notify_order_updates" as const, label: "Order status updates" },
              { key: "notify_promotions" as const, label: "Promotions & discount codes" },
              { key: "notify_new_arrivals" as const, label: "New arrivals & restocks" },
            ].map((n) => (
              <label key={n.key} className="flex items-center justify-between text-sm text-ink/70">
                {n.label}
                <input
                  type="checkbox"
                  checked={notifications[n.key]}
                  onChange={(e) => setNotifications({ ...notifications, [n.key]: e.target.checked })}
                  className="h-4 w-4 accent-gold-400"
                />
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-50">
          {savingProfile ? "Saving..." : profileMessage || "Save Changes"}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-5 border-t border-stone-line pt-8">
        <h2 className="eyebrow flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" /> Change Password
        </h2>
        {passwordError && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{passwordError}</p>}
        {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <input
            type="password"
            placeholder="Current password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            className="input-luxe"
          />
          <input
            type="password"
            placeholder="New password"
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            className="input-luxe"
          />
        </div>
        <button type="submit" disabled={savingPassword} className="btn-outline-dark disabled:opacity-50">
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
