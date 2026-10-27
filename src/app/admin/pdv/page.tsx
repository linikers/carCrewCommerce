import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("pdv");
  return { title: "pdv" };
}

export default async function Page() {
  await paginaDoModulo("pdv");
  return (
    <AdminLayout title="pdv">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="pdv" />
      </div>
    </AdminLayout>
  );
}
