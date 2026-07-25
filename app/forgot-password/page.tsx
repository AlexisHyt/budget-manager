import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex max-w-3xl justify-between gap-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to login
        </Link>
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
