-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "avatar_url" TEXT,
    "allow_public_view" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assessment_periods" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assessment_assignments" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "assessor_id" UUID NOT NULL,
    "assessee_id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback_responses" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "aspect" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reminder_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assessment_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "total_feedback_received" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_pins" (
    "id" UUID NOT NULL,
    "giver_id" UUID,
    "receiver_id" UUID,
    "given_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weekly_pin_allowance" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pins_remaining" INTEGER NOT NULL DEFAULT 4,
    "pins_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_pin_allowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "public"."profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "public"."profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_periods_month_year_key" ON "public"."assessment_periods"("month", "year");

-- CreateIndex
CREATE INDEX "idx_assessment_assignments_period" ON "public"."assessment_assignments"("period_id");

-- CreateIndex
CREATE INDEX "idx_assessment_assignments_assessor" ON "public"."assessment_assignments"("assessor_id");

-- CreateIndex
CREATE INDEX "idx_assessment_assignments_assessee" ON "public"."assessment_assignments"("assessee_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_assignments_period_id_assessor_id_assessee_id_key" ON "public"."assessment_assignments"("period_id", "assessor_id", "assessee_id");

-- CreateIndex
CREATE INDEX "idx_feedback_responses_assignment" ON "public"."feedback_responses"("assignment_id");

-- CreateIndex
CREATE INDEX "idx_reminder_logs_user_period" ON "public"."reminder_logs"("user_id", "period_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_history_user_id_period_id_key" ON "public"."assessment_history"("user_id", "period_id");

-- CreateIndex
CREATE INDEX "idx_employee_pins_week_year" ON "public"."employee_pins"("week_number", "year");

-- CreateIndex
CREATE INDEX "idx_employee_pins_month_year" ON "public"."employee_pins"("month", "year");

-- CreateIndex
CREATE INDEX "idx_employee_pins_giver" ON "public"."employee_pins"("giver_id");

-- CreateIndex
CREATE INDEX "idx_employee_pins_receiver" ON "public"."employee_pins"("receiver_id");

-- CreateIndex
CREATE INDEX "idx_weekly_pin_allowance_user_week_year" ON "public"."weekly_pin_allowance"("user_id", "week_number", "year");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_pin_allowance_user_id_week_number_year_key" ON "public"."weekly_pin_allowance"("user_id", "week_number", "year");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."assessment_assignments" ADD CONSTRAINT "assessment_assignments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_assignments" ADD CONSTRAINT "assessment_assignments_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_assignments" ADD CONSTRAINT "assessment_assignments_assessee_id_fkey" FOREIGN KEY ("assessee_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback_responses" ADD CONSTRAINT "feedback_responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assessment_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_logs" ADD CONSTRAINT "reminder_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminder_logs" ADD CONSTRAINT "reminder_logs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_history" ADD CONSTRAINT "assessment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assessment_history" ADD CONSTRAINT "assessment_history_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."assessment_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_pins" ADD CONSTRAINT "employee_pins_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_pins" ADD CONSTRAINT "employee_pins_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weekly_pin_allowance" ADD CONSTRAINT "weekly_pin_allowance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
