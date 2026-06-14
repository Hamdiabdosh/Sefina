-- AddForeignKey
ALTER TABLE "StudentTransfer" ADD CONSTRAINT "StudentTransfer_from_medresa_id_fkey" FOREIGN KEY ("from_medresa_id") REFERENCES "Medresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransfer" ADD CONSTRAINT "StudentTransfer_to_medresa_id_fkey" FOREIGN KEY ("to_medresa_id") REFERENCES "Medresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
