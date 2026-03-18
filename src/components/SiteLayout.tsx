import { ReactNode } from "react";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/fabric-bg.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "400px 400px",
        backgroundColor: "#faf8f5",
      }}
    >
      <Header />
      <main className="container-page py-8">{children}</main>
      <footer className="border-t border-slate-200">
        <div className="container-page py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Ramos Tecidos
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
