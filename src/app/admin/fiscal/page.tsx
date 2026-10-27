import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import FiscalAdmin from "@/modules/fiscal/ui/FiscalAdmin";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("fiscal");
  return { title: "Fiscal" };
}

export default async function FiscalPage() {
  await paginaDoModulo("fiscal");
  return (
    <AdminLayout title="Fiscal">
      <div style={{ padding: "24px" }}>
        <FiscalAdmin />
      </div>
    </AdminLayout>
  );
}
