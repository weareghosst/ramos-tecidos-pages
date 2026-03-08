import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LegacyAdminOrderRedirect() {
  const router = useRouter();
  const { orderId } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    if (!orderId || typeof orderId !== "string") return;

    router.replace(`/admin/pedidos/${orderId}`);
  }, [router, orderId]);

  return (
    <div className="p-6">
      Redirecionando para o pedido...
    </div>
  );
}