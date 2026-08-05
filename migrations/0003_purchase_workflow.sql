CREATE TABLE IF NOT EXISTS "erp_purchase_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "po_number" varchar(40) NOT NULL UNIQUE,
  "vendor_id" uuid NOT NULL REFERENCES "contacts"("id"),
  "order_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "total_amount" numeric(12,2) NOT NULL DEFAULT '0',
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "erp_purchase_order_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purchase_order_id" uuid NOT NULL REFERENCES "erp_purchase_orders"("id") ON DELETE cascade,
  "product_id" uuid REFERENCES "products"("id"), "description" varchar(255) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1, "unit_price" numeric(12,2) NOT NULL,
  "analytical_account_id" uuid REFERENCES "analytical_accounts"("id")
);
CREATE TABLE IF NOT EXISTS "erp_vendor_bills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bill_number" varchar(40) NOT NULL UNIQUE,
  "purchase_order_id" uuid REFERENCES "erp_purchase_orders"("id"), "vendor_id" uuid NOT NULL REFERENCES "contacts"("id"),
  "bill_date" date NOT NULL, "due_date" date NOT NULL, "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "amount_paid" numeric(12,2) NOT NULL DEFAULT '0',
  "payment_status" varchar(20) NOT NULL DEFAULT 'NOT_PAID', "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "erp_vendor_bill_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "vendor_bill_id" uuid NOT NULL REFERENCES "erp_vendor_bills"("id") ON DELETE cascade,
  "product_id" uuid REFERENCES "products"("id"), "description" varchar(255) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1, "unit_price" numeric(12,2) NOT NULL,
  "analytical_account_id" uuid REFERENCES "analytical_accounts"("id")
);
ALTER TABLE "erp_payments" ADD COLUMN IF NOT EXISTS "vendor_bill_id" uuid REFERENCES "erp_vendor_bills"("id");
