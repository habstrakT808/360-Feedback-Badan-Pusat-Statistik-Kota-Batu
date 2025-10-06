-- DropForeignKey
ALTER TABLE "public"."monthly_pin_allowance" DROP CONSTRAINT "monthly_pin_allowance_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."weekly_pin_allowance" DROP CONSTRAINT "weekly_pin_allowance_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."assessment_periods" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."monthly_pin_allowance" ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "pins_remaining" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "public"."notification_preferences" ALTER COLUMN "reminder_frequency" SET DEFAULT 'weekly';

-- AlterTable
ALTER TABLE "public"."notifications" ALTER COLUMN "priority" SET DEFAULT 'medium';

-- AlterTable
ALTER TABLE "public"."pin_periods" ALTER COLUMN "month" DROP NOT NULL,
ALTER COLUMN "year" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_roles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'user';

-- AlterTable
ALTER TABLE "public"."weekly_pin_allowance" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."weekly_pin_allowance" ADD CONSTRAINT "weekly_pin_allowance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."monthly_pin_allowance" ADD CONSTRAINT "monthly_pin_allowance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
