-- Replace roadmap/quest model with goal mini-tasks.
DROP TABLE IF EXISTS "Quest" CASCADE;
DROP TABLE IF EXISTS "Milestone" CASCADE;
DROP TABLE IF EXISTS "Roadmap" CASCADE;

ALTER TABLE "Goal" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE TABLE "GoalTask" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "xpReward" INTEGER NOT NULL DEFAULT 20,
    "goldReward" INTEGER NOT NULL DEFAULT 5,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GoalTask_goalId_idx" ON "GoalTask"("goalId");
ALTER TABLE "GoalTask" ADD CONSTRAINT "GoalTask_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
