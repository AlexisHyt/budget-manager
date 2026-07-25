"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { authClient } from "@/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface AccountPageClientProps {
  userCurrency?: string;
}

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
];

export function AccountPageClient({
  userCurrency = "USD",
}: AccountPageClientProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState(userCurrency);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [currencySuccess, setCurrencySuccess] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("The new password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    const { error: requestError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setIsSubmitting(false);

    if (requestError) {
      setPasswordError(requestError.message ?? "Failed to update password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess("Your password has been updated.");
  }

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    const { error: requestError } = await authClient.signOut();
    setIsSigningOut(false);

    if (requestError) {
      setSignOutError(requestError.message ?? "Failed to sign out");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleCurrencyChange(newCurrency: string) {
    setCurrencyError(null);
    setCurrencySuccess(null);
    setCurrency(newCurrency);
    setIsSavingCurrency(true);

    try {
      const response = await fetch("/api/user/update-currency", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (!response.ok) {
        const data = await response.json();
        setCurrencyError(data.error || "Failed to update currency");
        setCurrency(userCurrency);
        setIsSavingCurrency(false);
        return;
      }

      setCurrencySuccess("Currency updated successfully");
      setIsSavingCurrency(false);
    } catch (err) {
      setCurrencyError("Failed to update currency");
      setCurrency(userCurrency);
      setIsSavingCurrency(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Dark mode is the default, but you can switch whenever you want.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your app preferences and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={currency}
              onChange={(event) => handleCurrencyChange(event.target.value)}
              options={CURRENCIES}
              disabled={isSavingCurrency}
            />
          </div>
          {currencyError ? (
            <p className="text-sm text-destructive">{currencyError}</p>
          ) : null}
          {currencySuccess ? (
            <p className="text-sm text-emerald-500">{currencySuccess}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Update your password and revoke your other active sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-destructive">{passwordError}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-sm text-emerald-500">{passwordSuccess}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating password..." : "Update password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Password resets sent by email also revoke your other sessions.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Sign out from this device when you're done.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {signOutError ? (
            <p className="text-sm text-destructive">{signOutError}</p>
          ) : null}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
            disabled={isSigningOut}
            type="button"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
