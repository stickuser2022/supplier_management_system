-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    CONSTRAINT "tags_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
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
    "discovered_via" TEXT NOT NULL,
    "website" TEXT,
    "name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "short_name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "province_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "city_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "district_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "address_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "description_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "suppliers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_tags" (
    "supplier_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("supplier_id", "tag_id"),
    CONSTRAINT "supplier_tags_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supplier_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplier_id" INTEGER NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_ru" TEXT,
    "role_zh" TEXT,
    "role_ru" TEXT,
    "phone" TEXT,
    "wechat" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "qq" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "role_ru_auto_translated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    CONSTRAINT "contacts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_category_name_zh_key" ON "tags"("category", "name_zh");

-- CreateIndex
CREATE UNIQUE INDEX "tags_category_name_ru_key" ON "tags"("category", "name_ru");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
