-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplier_id" INTEGER NOT NULL,
    "contact_id" INTEGER,
    "quote_id" INTEGER,
    "content_zh" TEXT NOT NULL,
    "content_ru" TEXT,
    "content_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "happened_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" TEXT NOT NULL,
    CONSTRAINT "notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notes_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_notes" ("contact_id", "content_ru", "content_zh", "created_at", "created_by_id", "happened_at", "id", "is_active", "quote_id", "supplier_id", "updated_at") SELECT "contact_id", "content_ru", "content_zh", "created_at", "created_by_id", "happened_at", "id", "is_active", "quote_id", "supplier_id", "updated_at" FROM "notes";
DROP TABLE "notes";
ALTER TABLE "new_notes" RENAME TO "notes";
CREATE INDEX "notes_supplier_id_happened_at_idx" ON "notes"("supplier_id", "happened_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
