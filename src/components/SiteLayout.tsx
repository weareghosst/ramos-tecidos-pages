import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
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