import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabaseClient } from "@/lib/supabaseClient";

export function useAdminAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
      } else {
        setAuthenticated(true);
      }

      setChecking(false);
    }

    check();
  }, [router]);

  async function logout() {
    await supabaseClient.auth.signOut();
    router.replace("/admin/login");
  }

  return { checking, authenticated, logout };
}
