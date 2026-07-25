"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccount, Payment } from "@/drizzle/schema";
import { type CurrencyCode, formatCurrency } from "@/lib/budget/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">(
    "all",
  );
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    dueDate: new Date().toISOString().split("T")[0],
    bankAccountId: "",
    status: "pending",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrency();
    Promise.all([fetchPayments(), fetchAccounts()]);
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

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (response.ok) {
        setPayments(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
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

  const openModal = (payment?: Payment) => {
    if (payment) {
      setEditingId(payment.id);
      setFormData({
        name: payment.name,
        amount: payment.amount / 100,
        dueDate: new Date(payment.dueDate).toISOString().split("T")[0],
        bankAccountId: payment.bankAccountId,
        status: payment.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        amount: 0,
        dueDate: new Date().toISOString().split("T")[0],
        bankAccountId: "",
        status: "pending",
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
      const url = editingId ? `/api/payments/${editingId}` : "/api/payments";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paidDate:
            formData.status === "paid" ? new Date().toISOString() : null,
          completed: formData.status === "paid",
        }),
      });

      if (response.ok) {
        await fetchPayments();
        closeModal();
      }
    } catch (error) {
      console.error("Failed to save payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchPayments();
      }
    } catch (error) {
      console.error("Failed to delete payment:", error);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  if (loading)
    return <div className="animate-pulse text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">One-Time Payments</h1>
          <p className="text-muted-foreground">
            Track upcoming and past one-time payments
          </p>
        </div>
        <Button onClick={() => openModal()}>Add Payment</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status === "all" ? "All" : status}
          </Button>
        ))}
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
                Bank Account
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">{payment.name}</td>
                <td className="px-6 py-4 font-semibold">
                  {formatCurrency(payment.amount, currency)}
                </td>
                <td className="px-6 py-4">
                  {accounts.find((acc) => acc.id === payment.bankAccountId)
                    ?.name || "Unknown"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(payment.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      payment.status === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(payment)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(payment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No payments found.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? "Edit Payment" : "Add Payment"}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Payment Name</Label>
            <Input
              id="name"
              placeholder="e.g., Car Repair"
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
            />
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

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full rounded border border-input bg-background px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
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
