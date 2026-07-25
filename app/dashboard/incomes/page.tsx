"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccount, Income } from "@/drizzle/schema";
import { type CurrencyCode, formatCurrency } from "@/lib/budget/utils";

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
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
    bankAccountId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrency();
    Promise.all([fetchIncomes(), fetchAccounts()]);
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

  const fetchIncomes = async () => {
    try {
      const response = await fetch("/api/incomes");
      if (response.ok) {
        setIncomes(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
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

  const openModal = (income?: Income) => {
    if (income) {
      setEditingId(income.id);
      setFormData({
        name: income.name,
        amount: income.amount / 100,
        frequency: income.frequency,
        startDate: new Date(income.startDate).toISOString().split("T")[0],
        bankAccountId: income.bankAccountId || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        amount: 0,
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        bankAccountId: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/incomes/${editingId}` : "/api/incomes";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchIncomes();
        closeModal();
      }
    } catch (error) {
      console.error("Failed to save income:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchIncomes();
      }
    } catch (error) {
      console.error("Failed to delete income:", error);
    }
  };

  if (loading)
    return <div className="animate-pulse text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incomes</h1>
          <p className="text-muted-foreground">
            Track your income sources (salary, bonuses, etc.)
          </p>
        </div>
        <Button onClick={() => openModal()}>Add Income</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incomes.map((income) => (
              <tr key={income.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">{income.name}</td>
                <td className="px-6 py-4 font-semibold">
                  {formatCurrency(income.amount, currency)}
                </td>
                <td className="px-6 py-4 capitalize">{income.frequency}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(income.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(income)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(income.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {incomes.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No incomes yet.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? "Edit Income" : "Add Income"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Income Name</Label>
            <Input
              id="name"
              placeholder="e.g., Salary"
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
              <option value="annual">Annual</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

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
            <Label htmlFor="bankAccountId">Bank Account (Optional)</Label>
            <select
              id="bankAccountId"
              value={formData.bankAccountId}
              onChange={(e) =>
                setFormData({ ...formData, bankAccountId: e.target.value })
              }
              className="w-full rounded border border-input bg-background px-3 py-2"
            >
              <option value="">None</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
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
