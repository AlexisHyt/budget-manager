import { eq } from "drizzle-orm";
import { AccountPageClient } from "@/components/account/account-page-client";
import { AppTopNav } from "@/components/navigation/app-top-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await requireSession();
  const userRow = await db
    .select({ currency: user.currency })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  const userCurrency = userRow[0]?.currency ?? "USD";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppTopNav />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
            <CardDescription>
              Your private access details and current authentication status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Email verification
              </p>
              <p className="font-medium">
                {session.user.emailVerified ? "Verified" : "Not verified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="font-medium">Signed in</p>
            </div>
          </CardContent>
        </Card>

        <AccountPageClient userCurrency={userCurrency} />
      </div>
    </main>
  );
}
