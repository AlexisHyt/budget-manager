import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { account, user } from "../drizzle/schema";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function printUsage() {
  console.error(
    'Usage: npm run create-user -- --name "Jane Doe" --email jane@example.com --password "super-secret"',
  );
}

async function main() {
  const name = getArgValue("--name");
  const email = getArgValue("--email");
  const password = getArgValue("--password");

  if (!name || !email || !password) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedName) {
    console.error("The --name value cannot be empty.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("The password must be at least 8 characters long.");
    process.exitCode = 1;
    return;
  }

  const existingUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existingUsers.length > 0) {
    console.error(`A user already exists for ${normalizedEmail}.`);
    process.exitCode = 1;
    return;
  }

  const now = new Date();
  const userId = randomUUID();
  const accountId = randomUUID();
  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(account).values({
      id: accountId,
      userId,
      accountId: userId,
      providerId: "credential",
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  });

  console.log(`Created user ${normalizedEmail}.`);
}

void main();
