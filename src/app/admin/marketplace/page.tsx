import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import CanaisAdmin from "@/modules/marketplace/ui/CanaisAdmin";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("marketplace");
  return { title: "Marketplace" };
}

export default async function MarketplacePage() {
  await paginaDoModulo("marketplace");
  return (
    <AdminLayout title="Marketplace">
      <div style={{ padding: "24px" }}>
        <CanaisAdmin />
      </div>
    </AdminLayout>
  );
}
