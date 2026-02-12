import "@/styles/globals.css";
import type { AppProps } from "next/app";
import SiteLayout from "@/components/SiteLayout";

export default function App({ Component, pageProps, router }: AppProps) {
  const isAdminRoute = router.pathname.startsWith("/admin");

  const content = (
    <div key={router.asPath} className="fade-in">
      <Component {...pageProps} />
    </div>
  );

  if (isAdminRoute) return content;

  return <SiteLayout>{content}</SiteLayout>;
}
