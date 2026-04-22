/*
  Warnings:

  - Added the required column `updated_at` to the `landmarks` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_landmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "checkin_radius" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "guardian" TEXT NOT NULL,
    "influence_score" INTEGER NOT NULL,
    "influence_progress" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT,
    "address" TEXT,
    "amap_poi_id" TEXT
);
INSERT INTO "new_landmarks" ("checkin_radius", "city", "created_at", "description", "guardian", "id", "influence_progress", "influence_score", "latitude", "level", "longitude", "name", "status", "tags") SELECT "checkin_radius", "city", "created_at", "description", "guardian", "id", "influence_progress", "influence_score", "latitude", "level", "longitude", "name", "status", "tags" FROM "landmarks";
DROP TABLE "landmarks";
ALTER TABLE "new_landmarks" RENAME TO "landmarks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
