-- DropForeignKey
ALTER TABLE "MutablePicklist" DROP CONSTRAINT "MutablePicklist_tournamentKey_fkey";

-- DropForeignKey
ALTER TABLE "SharedPicklist" DROP CONSTRAINT "SharedPicklist_authorId_fkey";

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPicklist" ADD CONSTRAINT "SharedPicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
