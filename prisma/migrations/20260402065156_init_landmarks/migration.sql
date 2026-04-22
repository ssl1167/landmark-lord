-- CreateTable
CREATE TABLE "landmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "checkin_radius" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "guardian" TEXT NOT NULL,
    "influence_score" INTEGER NOT NULL,
    "influence_progress" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT
);
