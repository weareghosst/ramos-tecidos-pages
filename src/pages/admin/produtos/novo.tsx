import { useAdminAuth } from "@/hooks/useAdminAuth";
import ProductForm from "../../../components/admin/ProductForm";

export default function NewProductPage() {
  const { checking, authenticated } = useAdminAuth();

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  return <ProductForm />;
}
