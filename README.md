# Budget Manager

Private budget-manager starter built with Next.js App Router, Better Auth, Drizzle, PostgreSQL, and Resend.

## Run the project

```bash
npm install
npm run db:generate  # Generate migration from schema
npm run db:migrate   # Apply migration to database
npm run dev
```

Open `http://localhost:3000`.

## Create a user

Provision a private account from the terminal:

```bash
npm run create-user -- --name "Jane Doe" --email jane@example.com --password "super-secret-password"
```
