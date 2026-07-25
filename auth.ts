import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";
import { baseEmail, resend } from "@/lib/emails/resend.config";

const appName = "Budget Manager";
const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  "http://localhost:3000";
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? baseEmail;

function getResetPasswordEmail(name: string, url: string) {
  return {
    subject: `Reset your ${appName} password`,
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your password.",
      `Open this link to choose a new one: ${url}`,
      "",
      "If you didn't ask to reset your password, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
        <p style="margin-bottom: 16px;">Hello ${name},</p>
        <p style="margin-bottom: 16px;">
          We received a request to reset your ${appName} password.
        </p>
        <p style="margin-bottom: 24px;">
          <a
            href="${url}"
            style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none;"
          >
            Choose a new password
          </a>
        </p>
        <p style="margin-bottom: 0; color: #4b5563;">
          If you didn't ask to reset your password, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const email = getResetPasswordEmail(user.name, url);

      void resend.emails.send({
        from: resendFromEmail,
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    },
  },
  plugins: [nextCookies()],
});
