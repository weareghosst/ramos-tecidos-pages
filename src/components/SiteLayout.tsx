import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-ramos.png"
              alt="Ramos Tecidos"
              width={140}
              height={40}
              priority
              className="h-auto w-auto max-h-[40px]"
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/produtos" className="hover:text-slate-700">
              Produtos
            </Link>

            <Link href="/carrinho" className="btn-outline px-3 py-1.5 rounded-lg">
              Carrinho
            </Link>

            <Link href="/checkout" className="btn-primary px-3 py-1.5 rounded-lg">
              Finalizar
            </Link>
          </nav>
        </div>
      </header>

      <main className="container-page py-8">{children}</main>

      <footer className="border-t border-slate-200">
        <div className="container-page py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Ramos Tecidos
        </div>
      </footer>
    </div>
  );
}