ALTER TABLE "analytical_accounts" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
ALTER TABLE "analytical_accounts" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false;
ALTER TABLE "analytical_accounts" ADD COLUMN IF NOT EXISTS "created_by" uuid;

ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'DRAFT' NOT NULL;
ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "parent_budget_id" uuid;
ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "created_by" uuid;

ALTER TABLE "auto_analytical_models" ADD COLUMN IF NOT EXISTS "condition_type" varchar(30);
ALTER TABLE "auto_analytical_models" ADD COLUMN IF NOT EXISTS "condition_value" varchar(255);
ALTER TABLE "auto_analytical_models" ADD COLUMN IF NOT EXISTS "is_active" integer DEFAULT 1;

CREATE TABLE IF NOT EXISTS "budget_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "budget_id" uuid NOT NULL REFERENCES "budgets"("id") ON DELETE cascade,
  "analytical_account_id" uuid NOT NULL REFERENCES "analytical_accounts"("id"),
  "budgeted_amount" numeric(12, 2) NOT NULL,
  "type" varchar(20) NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "budget_lines_budget_id_idx" ON "budget_lines" ("budget_id");
CREATE INDEX IF NOT EXISTS "budget_lines_analytical_account_id_idx" ON "budget_lines" ("analytical_account_id");
