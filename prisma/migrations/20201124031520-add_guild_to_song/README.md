# Migration `20201124031520-add_guild_to_song`

This migration has been generated at 11/23/2020, 9:15:20 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
ALTER TABLE "songs" ADD COLUMN     "guild" TEXT
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200914023842-init..20201124031520-add_guild_to_song
--- datamodel.dml
+++ datamodel.dml
@@ -1,10 +1,10 @@
 // This is your Prisma schema file,
 // learn more about it in the docs: https://pris.ly/d/prisma-schema
 datasource db {
-  provider = "sqlite"
-  url = "***"
+  provider = "postgresql"
+  url = "***"
 }
 generator client {
   provider = "prisma-client-js"
@@ -15,8 +15,9 @@
   location  String   @unique
   title     String?
   createdAt DateTime @default(now())
   tags      Tag[]
+  guild     String?
   @@map("songs")
 }
```


