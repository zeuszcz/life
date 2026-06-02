-- CreateTable
CREATE TABLE "RoomItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomItem_userId_locationKey_idx" ON "RoomItem"("userId", "locationKey");

-- AddForeignKey
ALTER TABLE "RoomItem" ADD CONSTRAINT "RoomItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
