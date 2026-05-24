-- CreateTable
CREATE TABLE "quotes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplier_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "product_name_zh" TEXT NOT NULL,
    "product_name_ru" TEXT,
    "product_spec_zh" TEXT,
    "product_spec_ru" TEXT,
    "unit_price" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "unit_zh" TEXT,
    "unit_ru" TEXT,
    "moq" INTEGER,
    "quoted_at" DATETIME NOT NULL,
    "valid_until" DATETIME,
    "payment_terms" TEXT,
    "lead_time_days" INTEGER,
    "source" TEXT,
    "quote_batch_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "product_name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "product_spec_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    CONSTRAINT "quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quotes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quotes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quote_tags" (
    "quote_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("quote_id", "tag_id"),
    CONSTRAINT "quote_tags_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplier_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "quote_id" INTEGER,
    "content_zh" TEXT NOT NULL,
    "content_ru" TEXT,
    "happened_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    CONSTRAINT "notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notes_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "quotes_supplier_id_idx" ON "quotes"("supplier_id");

-- CreateIndex
CREATE INDEX "quotes_status_valid_until_idx" ON "quotes"("status", "valid_until");

-- CreateIndex
CREATE INDEX "notes_supplier_id_happened_at_idx" ON "notes"("supplier_id", "happened_at");
