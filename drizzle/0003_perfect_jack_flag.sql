ALTER TABLE "user" ALTER COLUMN "currency" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "currency" SET DEFAULT 'USD';