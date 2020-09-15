# Migration `20200914023842-init`

This migration has been generated at 9/13/2020, 9:38:42 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "songs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "song_id" INTEGER NOT NULL,

    FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE
)

CREATE UNIQUE INDEX "songs.location_unique" ON "songs"("location")

CREATE UNIQUE INDEX "song_tag" ON "tags"("tag", "song_id")
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20200914023842-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,31 @@
+// This is your Prisma schema file,
+// learn more about it in the docs: https://pris.ly/d/prisma-schema
+
+datasource db {
+  provider = "sqlite"
+  url = "***"
+}
+
+generator client {
+  provider = "prisma-client-js"
+}
+
+model Song {
+  id        Int      @default(autoincrement()) @id
+  location  String   @unique
+  title     String?
+  createdAt DateTime @default(now())
+  tags      Tag[]
+
+  @@map("songs")
+}
+
+model Tag {
+  id     Int    @default(autoincrement()) @id
+  tag    String
+  song   Song   @relation(fields: [songId], references: [id])
+  songId Int    @map("song_id")
+
+  @@map("tags")
+  @@unique([tag, songId], name: "song_tag")
+}
```


