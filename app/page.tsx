import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function Home() {
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex max-w-6xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
            Private access only
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Budget tracking with a clean workspace.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Sign in with the account that was created for you, reset your
              password by email when needed, and manage your account from a
              focused personal dashboard.
            </p>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
