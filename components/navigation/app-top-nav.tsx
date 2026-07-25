"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bank-accounts", label: "Bank Accounts" },
  { href: "/dashboard/incomes", label: "Incomes" },
  { href: "/dashboard/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/account", label: "Account" },
];

export function AppTopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="mr-2 text-sm font-semibold">
          Budget Manager
        </Link>
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
