-- DropForeignKey
ALTER TABLE "MutablePicklist" DROP CONSTRAINT "MutablePicklist_authorId_fkey";

-- DropForeignKey
ALTER TABLE "MutablePicklist" DROP CONSTRAINT "MutablePicklist_tournamentKey_fkey";

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE SET NULL ON UPDATE CASCADE;
