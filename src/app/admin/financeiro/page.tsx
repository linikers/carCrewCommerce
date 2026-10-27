import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("financeiro");
  return { title: "financeiro" };
}

export default async function Page() {
  await paginaDoModulo("financeiro");
  return (
    <AdminLayout title="financeiro">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="financeiro" />
      </div>
    </AdminLayout>
  );
}
