ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "portal_user_id" varchar(255);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "address" varchar(500);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "gstin" varchar(30);

CREATE TABLE IF NOT EXISTS "erp_sales_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "so_number" varchar(40) NOT NULL UNIQUE,
  "customer_id" uuid NOT NULL REFERENCES "contacts"("id"),
  "order_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "total_amount" numeric(12,2) NOT NULL DEFAULT '0',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "erp_sales_order_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sales_order_id" uuid NOT NULL REFERENCES "erp_sales_orders"("id") ON DELETE cascade,
  "product_id" uuid REFERENCES "products"("id"),
  "description" varchar(255) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(12,2) NOT NULL,
  "analytical_account_id" uuid REFERENCES "analytical_accounts"("id")
);
CREATE TABLE IF NOT EXISTS "erp_customer_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_number" varchar(40) NOT NULL UNIQUE,
  "sales_order_id" uuid REFERENCES "erp_sales_orders"("id"),
  "customer_id" uuid NOT NULL REFERENCES "contacts"("id"),
  "invoice_date" date NOT NULL,
  "due_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "total_amount" numeric(12,2) NOT NULL DEFAULT '0',
  "amount_paid" numeric(12,2) NOT NULL DEFAULT '0',
  "payment_status" varchar(20) NOT NULL DEFAULT 'NOT_PAID',
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "erp_customer_invoice_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_invoice_id" uuid NOT NULL REFERENCES "erp_customer_invoices"("id") ON DELETE cascade,
  "product_id" uuid REFERENCES "products"("id"),
  "description" varchar(255) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric(12,2) NOT NULL,
  "analytical_account_id" uuid REFERENCES "analytical_accounts"("id")
);
CREATE TABLE IF NOT EXISTS "erp_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payment_number" varchar(40) NOT NULL UNIQUE,
  "direction" varchar(12) NOT NULL,
  "contact_id" uuid NOT NULL REFERENCES "contacts"("id"),
  "customer_invoice_id" uuid REFERENCES "erp_customer_invoices"("id"),
  "amount" numeric(12,2) NOT NULL,
  "payment_date" date NOT NULL,
  "method" varchar(40) NOT NULL,
  "reference_no" varchar(100),
  "status" varchar(20) NOT NULL DEFAULT 'RECONCILED',
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "erp_sales_orders_customer_idx" ON "erp_sales_orders"("customer_id");
CREATE INDEX IF NOT EXISTS "erp_customer_invoices_customer_idx" ON "erp_customer_invoices"("customer_id");
CREATE INDEX IF NOT EXISTS "erp_payments_invoice_idx" ON "erp_payments"("customer_invoice_id");
