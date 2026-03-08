import "@/styles/globals.css";
import type { AppProps } from "next/app";
import SiteLayout from "@/components/SiteLayout";
import Head from "next/head";

export default function App({ Component, pageProps, router }: AppProps) {
  const isAdminRoute = router.pathname.startsWith("/admin");

  const content = (
    <>
      <Head>
        <title>Ramos Tecidos</title>
        <meta
          name="description"
          content="Loja de tecidos por metro com compra rápida no Pix."
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div key={router.asPath} className="fade-in">
        <Component {...pageProps} />
      </div>
    </>
  );

  if (isAdminRoute) return content;

  return <SiteLayout>{content}</SiteLayout>;
}