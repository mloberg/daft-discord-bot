/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[location,guild]` on the table `songs`. If there are existing duplicate values, the migration will fail.

*/
-- DropIndex
DROP INDEX "songs.location_unique";

-- CreateIndex
CREATE UNIQUE INDEX "songs.location_guild_unique" ON "songs"("location", "guild");
