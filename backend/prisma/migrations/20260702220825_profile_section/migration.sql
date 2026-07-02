-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "parsedAt" TIMESTAMP(3),
ADD COLUMN     "parsedData" JSONB;
