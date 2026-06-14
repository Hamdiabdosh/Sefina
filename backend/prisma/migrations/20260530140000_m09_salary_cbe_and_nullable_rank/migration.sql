-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "cbe_account" TEXT;

-- AlterTable
ALTER TABLE "SalaryPayment" ALTER COLUMN "salary_rank_id" DROP NOT NULL;
