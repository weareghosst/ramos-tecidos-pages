import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const FABRIC_TYPES = [
  "Tricoline Lisa",
  "Tricoline Estampada",
  "Tricoline Digital",
  "Malhas",
  "Mantas e Fibras",
  "Outros",
];

type ProductRow = {
  id: number;
  name: string;
  price_per_meter: string;
  fabric_type: string;
};

type ImportResult = {
  name: string;
  success: boolean;
  error?: string;
};

let nextId = 1;

function createRow(name = "", price = "", fabric = ""): ProductRow {
  return { id: nextId++, name, price_per_meter: price, fabric_type: fabric };
}

const PRODUTOS_SUGERIDOS = [
  "Tricoline Estampado",
  "Tricoline Liso",
  "Cetim com Elastano",
  "Cetim sem Elastano",
  "Tactel 2 Cabos",
  "Tactel 4 Cabos",
  "Tactel c/ Elastano",
  "Oxford Xadrez",
  "Oxford Estampado",
  "Oxford Liso",
  "Tricoline Digital",
  "Viscose",
  "Viscolinho",
  "Bandeira do Brasil Helanca Light",
  "Bandeira do Brasil Bember",
  "Feltro",
  "Atoalhado Poliéster",
  "Atoalhado de Algodão",
  "Laise de Poliéster",
  "Laise de Algodão",
  "Tricoline Mista",
  "Gabardine Leve (Oxfordine)",
  "Gabardine Pesado",
  "Juta 1.5 de Largura",
  "Juta 1.0 de Largura",
  "Crepe Dunas",
  "Linho Rústico",
  "Linho Misto",
  "Crepe Amanda",
  "Alfaiataria",
  "Alfaiataria Sensoriale",
  "Corta Vento",
  "Chita de Poliéster",
  "Chita de Algodão",
  "Two Way",
  "Tule 1.20",
  "Algodão Cru 1,70 de Largura",
  "Algodão Cru 2.50 de Largura",
  "Flanela Sarjada",
];

export default function ImportarProdutos() {
  const { checking, authenticated } = useAdminAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ProductRow[]>([createRow()]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [globalPrice, setGlobalPrice] = useState("");
  const [globalFabric, setGlobalFabric] = useState("");

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: keyof ProductRow, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function applyGlobalPrice() {
    if (!globalPrice.trim()) return;
    setRows((prev) => prev.map((r) => ({ ...r, price_per_meter: globalPrice })));
  }

  function applyGlobalFabric() {
    if (!globalFabric.trim()) return;
    setRows((prev) => prev.map((r) => ({ ...r, fabric_type: globalFabric })));
  }

  function loadSuggested() {
    const newRows = PRODUTOS_SUGERIDOS.map((name) =>
      createRow(name, globalPrice, globalFabric)
    );
    setRows(newRows);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const newRows = lines.map((name) => createRow(name, globalPrice, globalFabric));
    setRows(newRows);
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.name.trim());

    if (valid.length === 0) {
      alert("Adicione pelo menos um produto com nome.");
      return;
    }

    const products = valid.map((r) => ({
      name: r.name.trim(),
      price_per_meter: Number(r.price_per_meter.replace(",", ".")) || 0,
      fabric_type: r.fabric_type || null,
    }));

    try {
      setImporting(true);
      setResults(null);

      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao importar");

      setResults(data.results);
    } catch (err: any) {
      alert(err?.message || "Erro ao importar produtos");
    } finally {
      setImporting(false);
    }
  }

  const successCount = results?.filter((r) => r.success).length || 0;
  const errorCount = results?.filter((r) => !r.success).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar produtos</h1>
          <p className="mt-2 text-slate-600">Adicione vários produtos de uma só vez.</p>
        </div>
        <Link href="/admin/produtos" className="btn-outline px-4 py-2 rounded-lg">
          Voltar
        </Link>
      </div>

      {/* ATALHOS GLOBAIS */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Aplicar para todos</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Preço padrão (ex: 19.90)"
              value={globalPrice}
              onChange={(e) => setGlobalPrice(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={applyGlobalPrice}
              className="btn-outline px-4 py-2 rounded-xl whitespace-nowrap"
            >
              Aplicar preço
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={globalFabric}
              onChange={(e) => setGlobalFabric(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400"
            >
              <option value="">Categoria padrão</option>
              {FABRIC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyGlobalFabric}
              className="btn-outline px-4 py-2 rounded-xl whitespace-nowrap"
            >
              Aplicar categoria
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={loadSuggested}
            className="btn-outline px-4 py-2 rounded-xl text-sm"
          >
            📋 Carregar lista sugerida ({PRODUTOS_SUGERIDOS.length} produtos)
          </button>
          <button
            type="button"
            onClick={addRow}
            className="btn-outline px-4 py-2 rounded-xl text-sm"
          >
            + Adicionar linha
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-500">Ou cole uma lista de nomes (um por linha):</p>
          <textarea
            placeholder={"Tricoline Estampado\nTricoline Liso\nCetim com Elastano"}
            onPaste={handlePaste}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 resize-none"
          />
        </div>
      </div>

      {/* TABELA DE PRODUTOS */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 w-8">#</th>
                <th className="px-4 py-3">Nome do produto</th>
                <th className="px-4 py-3 w-40">Preço / metro</th>
                <th className="px-4 py-3 w-52">Categoria</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400 text-xs">{index + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      placeholder="Nome do produto"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.price_per_meter}
                      onChange={(e) => updateRow(row.id, "price_per_meter", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={row.fabric_type}
                      onChange={(e) => updateRow(row.id, "fabric_type", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 text-sm"
                    >
                      <option value="">Selecione</option>
                      {FABRIC_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-slate-400 hover:text-red-600 transition text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTÃO IMPORTAR */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="btn-primary px-6 py-3 disabled:opacity-50"
        >
          {importing ? "Importando..." : `Importar ${rows.filter((r) => r.name.trim()).length} produtos`}
        </button>

        <span className="text-sm text-slate-500">
          {rows.filter((r) => r.name.trim()).length} produtos prontos para importar
        </span>
      </div>

      {/* RESULTADOS */}
      {results && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Resultado da importação</h2>
            <span className="rounded-full px-3 py-1 text-xs font-medium text-green-700 bg-green-100">
              {successCount} importados
            </span>
            {errorCount > 0 && (
              <span className="rounded-full px-3 py-1 text-xs font-medium text-red-700 bg-red-100">
                {errorCount} erros
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm px-4 py-2 rounded-lg ${
                  r.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                <span>{r.success ? "✓" : "✗"}</span>
                <span className="flex-1">{r.name}</span>
                {r.error && <span className="text-xs opacity-70">{r.error}</span>}
              </div>
            ))}
          </div>

          {successCount > 0 && (
            <div className="flex gap-3 pt-2">
              <Link href="/admin/produtos" className="btn-primary px-4 py-2">
                Ver produtos
              </Link>
              <button
                type="button"
                onClick={() => { setResults(null); setRows([createRow()]); }}
                className="btn-outline px-4 py-2"
              >
                Nova importação
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
