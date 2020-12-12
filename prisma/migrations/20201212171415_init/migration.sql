-- CreateTable
CREATE TABLE "songs" (
"id" SERIAL,
    "location" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guild" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
"id" SERIAL,
    "tag" TEXT NOT NULL,
    "song_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "songs.location_unique" ON "songs"("location");

-- CreateIndex
CREATE UNIQUE INDEX "song_tag" ON "tags"("tag", "song_id");

-- AddForeignKey
ALTER TABLE "tags" ADD FOREIGN KEY("song_id")REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
