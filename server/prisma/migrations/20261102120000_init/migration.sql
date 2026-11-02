-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "activity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "goals";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nutrition";

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity"."sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition"."foods" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "servingLabel" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition"."entries" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "occurredOn" DATE NOT NULL,
    "mealType" TEXT NOT NULL,
    "foodId" UUID,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition"."water" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "occurredOn" DATE NOT NULL,
    "amountMl" INTEGER NOT NULL,

    CONSTRAINT "water_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals"."targets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "targetDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals"."progress_marks" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "progress_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_occurredOn_idx" ON "activity"."sessions"("userId", "occurredOn");

-- CreateIndex
CREATE INDEX "sessions_userId_type_occurredOn_idx" ON "activity"."sessions"("userId", "type", "occurredOn");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_userId_source_externalId_key" ON "activity"."sessions"("userId", "source", "externalId");

-- CreateIndex
CREATE INDEX "foods_userId_idx" ON "nutrition"."foods"("userId");

-- CreateIndex
CREATE INDEX "entries_userId_occurredOn_idx" ON "nutrition"."entries"("userId", "occurredOn");

-- CreateIndex
CREATE INDEX "water_userId_occurredOn_idx" ON "nutrition"."water"("userId", "occurredOn");

-- CreateIndex
CREATE INDEX "targets_userId_status_idx" ON "goals"."targets"("userId", "status");

-- CreateIndex
CREATE INDEX "progress_marks_goalId_recordedAt_idx" ON "goals"."progress_marks"("goalId", "recordedAt");

-- AddForeignKey
ALTER TABLE "nutrition"."entries" ADD CONSTRAINT "entries_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "nutrition"."foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals"."progress_marks" ADD CONSTRAINT "progress_marks_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"."targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
