"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccount, Subscription } from "@/drizzle/schema";
import { type CurrencyCode, formatCurrency } from "@/lib/budget/utils";

const INDICATORS = [
  { value: "important", label: "Important", color: "#3b82f6" },
  { value: "ok", label: "OK", color: "#22c55e" },
  { value: "fine", label: "Fine", color: "#f59e0b" },
  { value: "to-remove", label: "To Remove", color: "#ef4444" },
] as const;

type IndicatorValue = (typeof INDICATORS)[number]["value"];

const subscriptionFrequencyPeriodLabel: Record<string, string> = {
  monthly: "mo",
  "every-two-months": "2mo",
  "bi-annual": "6mo",
  annual: "yr",
};

function IndicatorBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const ind = INDICATORS.find((i) => i.value === value);
  if (!ind) return null;
  return (
    <span
      className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm"
      style={{ backgroundColor: ind.color }}
      title={ind.label}
    />
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    bankAccountId: "",
    imageUrl: "",
    indicator: "" as IndicatorValue | "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrency();
    Promise.all([fetchSubscriptions(), fetchAccounts()]);
  }, []);

  const fetchCurrency = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setCurrency(data.currency || "USD");
      }
    } catch (error) {
      console.error("Failed to fetch currency:", error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        setSubscriptions(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts");
      if (response.ok) {
        setAccounts(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (subscription?: Subscription) => {
    if (subscription) {
      setEditingId(subscription.id);
      setFormData({
        name: subscription.name,
        amount: subscription.amount / 100,
        frequency: subscription.frequency,
        startDate: new Date(subscription.startDate).toISOString().split("T")[0],
        endDate: subscription.endDate
          ? new Date(subscription.endDate).toISOString().split("T")[0]
          : "",
        bankAccountId: subscription.bankAccountId,
        imageUrl: subscription.imageUrl || "",
        indicator: (subscription.indicator as IndicatorValue | null) || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        amount: 0,
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        bankAccountId: "",
        imageUrl: "",
        indicator: "",
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/subscriptions/${editingId}`
        : "/api/subscriptions";

      const payload = {
        ...formData,
        indicator: formData.indicator || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchSubscriptions();
        closeModal();
      }
    } catch (error) {
      console.error("Failed to save subscription:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error("Failed to delete subscription:", error);
    }
  };

  if (loading)
    return <div className="animate-pulse text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your recurring subscriptions
          </p>
        </div>
        <Button onClick={() => openModal()}>Add Subscription</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subscriptions
          .filter((s) => s.active)
          .map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {sub.imageUrl && (
                <div className="relative h-40 w-full bg-muted">
                  <Image
                    src={sub.imageUrl}
                    alt={sub.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{sub.name}</h3>
                  <IndicatorBadge value={sub.indicator} />
                </div>
                <p className="mt-2 text-lg font-bold text-primary">
                  {formatCurrency(sub.amount, currency)}/
                  {subscriptionFrequencyPeriodLabel[sub.frequency] ?? "mo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sub.startDate).toLocaleDateString()}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(sub)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(sub.id)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {subscriptions.filter((s) => s.active).length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-muted-foreground">No subscriptions yet.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title={editingId ? "Edit Subscription" : "Add Subscription"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Subscription Name</Label>
            <Input
              id="name"
              placeholder="e.g., Netflix"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full rounded border border-input bg-background px-3 py-2"
            >
              <option value="monthly">Monthly</option>
              <option value="every-two-months">Every two months</option>
              <option value="bi-annual">Bi-annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bankAccountId">Bank Account *</Label>
            <select
              id="bankAccountId"
              value={formData.bankAccountId}
              onChange={(e) =>
                setFormData({ ...formData, bankAccountId: e.target.value })
              }
              className="w-full rounded border border-input bg-background px-3 py-2"
              required
            >
              <option value="">Select an account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label>Indicator (Optional)</Label>
            <div className="mt-1.5 flex gap-2">
              {INDICATORS.map((ind) => (
                <button
                  key={ind.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      indicator:
                        formData.indicator === ind.value ? "" : ind.value,
                    })
                  }
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                    formData.indicator === ind.value
                      ? "border-transparent ring-2"
                      : "border-border hover:bg-muted"
                  }`}
                  style={
                    formData.indicator === ind.value
                      ? ({
                          ringColor: ind.color,
                          borderColor: ind.color,
                          backgroundColor: `${ind.color}18`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: ind.color }}
                  />
                  {ind.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="image">Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {formData.imageUrl && (
              <div className="relative mt-2 h-20 w-20">
                <Image
                  src={formData.imageUrl}
                  alt="preview"
                  fill
                  className="rounded object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
