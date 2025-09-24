-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_key" ON "public"."user_roles"("user_id");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
