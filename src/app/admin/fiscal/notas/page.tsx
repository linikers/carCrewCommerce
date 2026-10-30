import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import NotasFiscais from "@/modules/fiscal/ui/NotasFiscais";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("fiscal");
  return { title: "Notas fiscais" };
}

export default async function NotasPage() {
  await paginaDoModulo("fiscal");
  return (
    <AdminLayout title="Notas fiscais">
      <NotasFiscais />
    </AdminLayout>
  );
}
