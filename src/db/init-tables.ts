import { db } from "@/db/db";
import { sql } from "drizzle-orm";

export async function initTables(resetSchema = false) {
  console.log("🛠️ Initializing Neon Postgres tables...");

  if (resetSchema) {
    console.log("⚠️ Resetting legacy schema tables...");
    const dropQueries = [
      `DROP TABLE IF EXISTS "budget_revisions" CASCADE;`,
      `DROP TABLE IF EXISTS "budget_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "budgets" CASCADE;`,
      `DROP TABLE IF EXISTS "payment_allocations" CASCADE;`,
      `DROP TABLE IF EXISTS "payments" CASCADE;`,
      `DROP TABLE IF EXISTS "vendor_bill_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "vendor_bills" CASCADE;`,
      `DROP TABLE IF EXISTS "purchase_order_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "purchase_orders" CASCADE;`,
      `DROP TABLE IF EXISTS "customer_invoice_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "customer_invoices" CASCADE;`,
      `DROP TABLE IF EXISTS "sales_order_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "sales_orders" CASCADE;`,
      `DROP TABLE IF EXISTS "journal_lines" CASCADE;`,
      `DROP TABLE IF EXISTS "journal_entries" CASCADE;`,
      `DROP TABLE IF EXISTS "auto_analytical_models" CASCADE;`,
      `DROP TABLE IF EXISTS "products" CASCADE;`,
      `DROP TABLE IF EXISTS "product_categories" CASCADE;`,
      `DROP TABLE IF EXISTS "analytical_accounts" CASCADE;`,
      `DROP TABLE IF EXISTS "contacts" CASCADE;`,
      `DROP TABLE IF EXISTS "audit_logs" CASCADE;`,
    ];
    for (const dq of dropQueries) {
      try {
        await db.execute(sql.raw(dq));
      } catch (e) {
        console.warn("Drop table note:", e instanceof Error ? e.message : e);
      }
    }
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "email_verified" boolean NOT NULL DEFAULT false,
      "image" text,
      "role" text NOT NULL DEFAULT 'CUSTOMER',
      "banned" boolean DEFAULT false,
      "ban_reason" text,
      "ban_expires" timestamp,
      "contact_id" text,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );`,

    `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;`,
    `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;`,
    `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;`,

    `CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY,
      "expires_at" timestamp NOT NULL,
      "token" text NOT NULL UNIQUE,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now(),
      "ip_address" text,
      "user_agent" text,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY,
      "account_id" text NOT NULL,
      "provider_id" text NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" text,
      "refresh_token" text,
      "id_token" text,
      "access_token_expires_at" timestamp,
      "refresh_token_expires_at" timestamp,
      "scope" text,
      "password" text,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "contacts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar(255) NOT NULL,
      "company_name" varchar(255),
      "email" varchar(255),
      "phone" varchar(50),
      "type" varchar(50) NOT NULL DEFAULT 'CUSTOMER',
      "gstin" varchar(30),
      "billing_address" text,
      "shipping_address" text,
      "portal_user_id" text,
      "default_currency" varchar(10) DEFAULT 'INR',
      "payment_terms" varchar(100) DEFAULT 'Net 30',
      "is_active" boolean DEFAULT true,
      "is_archived" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "analytical_accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "code" varchar(50) NOT NULL UNIQUE,
      "name" varchar(255) NOT NULL,
      "description" text,
      "account_type" varchar(50) DEFAULT 'COST_CENTER',
      "responsible_person" varchar(255),
      "parent_id" uuid,
      "active" boolean DEFAULT true,
      "is_archived" boolean DEFAULT false,
      "created_by" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "product_categories" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar(100) NOT NULL UNIQUE,
      "description" text,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "products" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sku" varchar(100) NOT NULL UNIQUE,
      "name" varchar(255) NOT NULL,
      "description" text,
      "category" varchar(100) DEFAULT 'Furniture',
      "category_id" uuid REFERENCES "product_categories"("id"),
      "unit_of_measure" varchar(20) DEFAULT 'Units',
      "sales_price" numeric(12,2) NOT NULL DEFAULT '0.00',
      "purchase_price" numeric(12,2) NOT NULL DEFAULT '0.00',
      "tax_rate" numeric(5,2) NOT NULL DEFAULT '18.00',
      "total_stock" integer DEFAULT 10,
      "default_analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "active" boolean DEFAULT true,
      "is_archived" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "auto_analytical_models" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar(255) NOT NULL,
      "priority" integer NOT NULL DEFAULT 0,
      "analytical_account_id" uuid NOT NULL REFERENCES "analytical_accounts"("id"),
      "match_product_id" uuid REFERENCES "products"("id"),
      "match_category" varchar(100),
      "match_contact_id" uuid REFERENCES "contacts"("id"),
      "condition_type" varchar(50) DEFAULT 'PRODUCT',
      "condition_value" varchar(255),
      "is_active" boolean DEFAULT true,
      "stop_processing" boolean DEFAULT true,
      "effective_start_date" date,
      "effective_end_date" date,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "budgets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "budget_number" varchar(50) NOT NULL UNIQUE,
      "name" varchar(255) NOT NULL,
      "analytical_account_id" uuid NOT NULL REFERENCES "analytical_accounts"("id"),
      "budget_type" varchar(20) NOT NULL DEFAULT 'EXPENSE',
      "planned_income" numeric(12,2) NOT NULL DEFAULT '0.00',
      "planned_expense" numeric(12,2) NOT NULL DEFAULT '0.00',
      "amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "start_date" date NOT NULL,
      "end_date" date NOT NULL,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "notes" text,
      "created_by" text,
      "approved_by" text,
      "approved_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "budget_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "budget_id" uuid NOT NULL REFERENCES "budgets"("id") ON DELETE CASCADE,
      "analytical_account_id" uuid NOT NULL REFERENCES "analytical_accounts"("id"),
      "budgeted_amount" numeric(12,2) NOT NULL,
      "type" varchar(20) NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "budget_revisions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "budget_id" uuid NOT NULL REFERENCES "budgets"("id") ON DELETE CASCADE,
      "revision_number" varchar(20) NOT NULL,
      "previous_planned_income" numeric(12,2) NOT NULL,
      "revised_planned_income" numeric(12,2) NOT NULL,
      "previous_planned_expense" numeric(12,2) NOT NULL,
      "revised_planned_expense" numeric(12,2) NOT NULL,
      "difference" numeric(12,2) NOT NULL,
      "reason" text NOT NULL,
      "effective_date" date NOT NULL,
      "created_by" text,
      "approved_by" text,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "journal_entries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "entry_number" varchar(50) NOT NULL UNIQUE,
      "date" date NOT NULL,
      "source_document_type" varchar(50) DEFAULT 'MANUAL',
      "source_document_id" uuid,
      "reference" varchar(255),
      "description" text,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "is_reversal" boolean DEFAULT false,
      "reversed_entry_id" uuid,
      "posted_by" text,
      "posted_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "journal_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "journal_entry_id" uuid NOT NULL REFERENCES "journal_entries"("id") ON DELETE CASCADE,
      "gl_account" varchar(100) NOT NULL,
      "debit" numeric(12,2) NOT NULL DEFAULT '0.00',
      "credit" numeric(12,2) NOT NULL DEFAULT '0.00',
      "analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "contact_id" uuid REFERENCES "contacts"("id"),
      "description" varchar(255),
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "sales_orders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "so_number" varchar(40) NOT NULL UNIQUE,
      "customer_id" uuid NOT NULL REFERENCES "contacts"("id"),
      "order_date" date NOT NULL,
      "expiry_date" date,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "untaxed_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "tax_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "total_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "notes" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "sales_order_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
      "product_id" uuid REFERENCES "products"("id"),
      "description" varchar(255) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 1,
      "unit_price" numeric(12,2) NOT NULL,
      "discount" numeric(5,2) NOT NULL DEFAULT '0.00',
      "tax_rate" numeric(5,2) NOT NULL DEFAULT '18.00',
      "subtotal" numeric(12,2) NOT NULL,
      "analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "is_auto_assigned" varchar(10) DEFAULT 'AUTO',
      "matched_rule_id" uuid
    );`,

    `CREATE TABLE IF NOT EXISTS "customer_invoices" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "invoice_number" varchar(40) NOT NULL UNIQUE,
      "sales_order_id" uuid REFERENCES "sales_orders"("id"),
      "customer_id" uuid NOT NULL REFERENCES "contacts"("id"),
      "invoice_date" date NOT NULL,
      "due_date" date NOT NULL,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "untaxed_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "tax_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "total_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "amount_paid" numeric(12,2) NOT NULL DEFAULT '0.00',
      "payment_status" varchar(20) NOT NULL DEFAULT 'NOT_PAID',
      "posted_by" text,
      "posted_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "customer_invoice_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "customer_invoice_id" uuid NOT NULL REFERENCES "customer_invoices"("id") ON DELETE CASCADE,
      "product_id" uuid REFERENCES "products"("id"),
      "description" varchar(255) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 1,
      "unit_price" numeric(12,2) NOT NULL,
      "discount" numeric(5,2) NOT NULL DEFAULT '0.00',
      "tax_rate" numeric(5,2) NOT NULL DEFAULT '18.00',
      "subtotal" numeric(12,2) NOT NULL,
      "analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "is_auto_assigned" varchar(10) DEFAULT 'AUTO',
      "matched_rule_id" uuid
    );`,

    `CREATE TABLE IF NOT EXISTS "purchase_orders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "po_number" varchar(40) NOT NULL UNIQUE,
      "vendor_id" uuid NOT NULL REFERENCES "contacts"("id"),
      "order_date" date NOT NULL,
      "expected_date" date,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "untaxed_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "tax_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "total_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "notes" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "purchase_order_id" uuid NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
      "product_id" uuid REFERENCES "products"("id"),
      "description" varchar(255) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 1,
      "unit_price" numeric(12,2) NOT NULL,
      "discount" numeric(5,2) NOT NULL DEFAULT '0.00',
      "tax_rate" numeric(5,2) NOT NULL DEFAULT '18.00',
      "subtotal" numeric(12,2) NOT NULL,
      "analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "is_auto_assigned" varchar(10) DEFAULT 'AUTO',
      "matched_rule_id" uuid
    );`,

    `CREATE TABLE IF NOT EXISTS "vendor_bills" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "bill_number" varchar(40) NOT NULL UNIQUE,
      "purchase_order_id" uuid REFERENCES "purchase_orders"("id"),
      "vendor_id" uuid NOT NULL REFERENCES "contacts"("id"),
      "bill_date" date NOT NULL,
      "due_date" date NOT NULL,
      "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
      "untaxed_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "tax_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "total_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
      "amount_paid" numeric(12,2) NOT NULL DEFAULT '0.00',
      "payment_status" varchar(20) NOT NULL DEFAULT 'NOT_PAID',
      "posted_by" text,
      "posted_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "vendor_bill_lines" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "vendor_bill_id" uuid NOT NULL REFERENCES "vendor_bills"("id") ON DELETE CASCADE,
      "product_id" uuid REFERENCES "products"("id"),
      "description" varchar(255) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 1,
      "unit_price" numeric(12,2) NOT NULL,
      "discount" numeric(5,2) NOT NULL DEFAULT '0.00',
      "tax_rate" numeric(5,2) NOT NULL DEFAULT '18.00',
      "subtotal" numeric(12,2) NOT NULL,
      "analytical_account_id" uuid REFERENCES "analytical_accounts"("id"),
      "is_auto_assigned" varchar(10) DEFAULT 'AUTO',
      "matched_rule_id" uuid
    );`,

    `CREATE TABLE IF NOT EXISTS "payments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "payment_number" varchar(50) NOT NULL UNIQUE,
      "direction" varchar(20) NOT NULL,
      "contact_id" uuid NOT NULL REFERENCES "contacts"("id"),
      "amount" numeric(12,2) NOT NULL,
      "payment_date" date NOT NULL,
      "method" varchar(50) NOT NULL DEFAULT 'BANK_TRANSFER',
      "reference_no" varchar(100),
      "provider_transaction_id" varchar(255),
      "status" varchar(20) NOT NULL DEFAULT 'RECONCILED',
      "notes" text,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "payment_allocations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
      "document_type" varchar(30) NOT NULL,
      "document_id" uuid NOT NULL,
      "allocated_amount" numeric(12,2) NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "actor_id" text,
      "actor_name" varchar(255),
      "action" varchar(100) NOT NULL,
      "entity_type" varchar(100) NOT NULL,
      "entity_id" varchar(100),
      "details" text,
      "before_value" text,
      "after_value" text,
      "ip_address" varchar(50),
      "created_at" timestamp DEFAULT now()
    );`,
  ];

  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
    } catch (e) {
      console.warn("Table init note:", e instanceof Error ? e.message : e);
    }
  }

  console.log("✅ Neon Postgres tables initialized!");
}
