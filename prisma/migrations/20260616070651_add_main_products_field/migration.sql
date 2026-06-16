-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_ru" TEXT,
    "short_name_zh" TEXT,
    "short_name_ru" TEXT,
    "province_zh" TEXT NOT NULL,
    "province_ru" TEXT,
    "city_zh" TEXT NOT NULL,
    "city_ru" TEXT,
    "district_zh" TEXT,
    "district_ru" TEXT,
    "address_zh" TEXT,
    "address_ru" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "cooperation_level" TEXT NOT NULL DEFAULT 'INITIAL_CONTACT',
    "description_zh" TEXT,
    "description_ru" TEXT,
    "main_products_zh" TEXT,
    "main_products_ru" TEXT,
    "discovered_via" TEXT NOT NULL,
    "website" TEXT,
    "name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "short_name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "province_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "city_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "district_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "address_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "description_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "main_products_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "suppliers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_suppliers" ("address_ru", "address_ru_auto_translated", "address_zh", "city_ru", "city_ru_auto_translated", "city_zh", "code", "cooperation_level", "created_at", "created_by_id", "description_ru", "description_ru_auto_translated", "description_zh", "discovered_via", "district_ru", "district_ru_auto_translated", "district_zh", "id", "is_active", "latitude", "longitude", "name_ru", "name_ru_auto_translated", "name_zh", "province_ru", "province_ru_auto_translated", "province_zh", "short_name_ru", "short_name_ru_auto_translated", "short_name_zh", "updated_at", "website") SELECT "address_ru", "address_ru_auto_translated", "address_zh", "city_ru", "city_ru_auto_translated", "city_zh", "code", "cooperation_level", "created_at", "created_by_id", "description_ru", "description_ru_auto_translated", "description_zh", "discovered_via", "district_ru", "district_ru_auto_translated", "district_zh", "id", "is_active", "latitude", "longitude", "name_ru", "name_ru_auto_translated", "name_zh", "province_ru", "province_ru_auto_translated", "province_zh", "short_name_ru", "short_name_ru_auto_translated", "short_name_zh", "updated_at", "website" FROM "suppliers";
DROP TABLE "suppliers";
ALTER TABLE "new_suppliers" RENAME TO "suppliers";
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
