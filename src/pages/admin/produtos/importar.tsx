import { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const FABRIC_TYPES = [
  "Tricoline Lisa", "Tricoline Estampada", "Tricoline Digital",
  "Malhas", "Mantas e Fibras", "Outros",
];

type ProductRow = {
  id: number;
  name: string;
  cost_price: string;
  price_per_meter: string;
  fabric_type: string;
};

type ImportResult = {
  name: string;
  success: boolean;
  error?: string;
};

let nextId = 1;

function calcSalePrice(cost: string): string {
  const n = Number(cost.replace(",", "."));
  if (!n || n <= 0) return "";
  return (n * 1.3).toFixed(2);
}

function createRow(name = "", cost = "", fabric = ""): ProductRow {
  return {
    id: nextId++,
    name,
    cost_price: cost,
    price_per_meter: calcSalePrice(cost),
    fabric_type: fabric,
  };
}

const PRODUTOS_SUGERIDOS = [
  "Tricoline Estampado","Tricoline Liso","Cetim com Elastano","Cetim sem Elastano",
  "Tactel 2 Cabos","Tactel 4 Cabos","Tactel c/ Elastano","Oxford Xadrez",
  "Oxford Estampado","Oxford Liso","Tricoline Digital","Viscose","Viscolinho",
  "Bandeira do Brasil Helanca Light","Bandeira do Brasil Bember","Feltro",
  "Atoalhado Poliéster","Atoalhado de Algodão","Laise de Poliéster","Laise de Algodão",
  "Tricoline Mista","Gabardine Leve (Oxfordine)","Gabardine Pesado",
  "Juta 1.5 de Largura","Juta 1.0 de Largura","Crepe Dunas","Linho Rústico",
  "Linho Misto","Crepe Amanda","Alfaiataria","Alfaiataria Sensoriale","Corta Vento",
  "Chita de Poliéster","Chita de Algodão","Two Way","Tule 1.20",
  "Algodão Cru 1,70 de Largura","Algodão Cru 2.50 de Largura","Flanela Sarjada",
];

const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";

export default function ImportarProdutos() {
  const { checking, authenticated } = useAdminAuth();

  const [rows, setRows] = useState<ProductRow[]>([createRow()]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [globalCost, setGlobalCost] = useState("");
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
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // recalcula preço de venda ao mudar custo
      if (field === "cost_price") {
        updated.price_per_meter = calcSalePrice(value);
      }
      return updated;
    }));
  }

  function applyGlobalCost() {
    if (!globalCost.trim()) return;
    const sale = calcSalePrice(globalCost);
    setRows((prev) => prev.map((r) => ({ ...r, cost_price: globalCost, price_per_meter: sale })));
  }

  function applyGlobalFabric() {
    if (!globalFabric.trim()) return;
    setRows((prev) => prev.map((r) => ({ ...r, fabric_type: globalFabric })));
  }

  function loadSuggested() {
    const newRows = PRODUTOS_SUGERIDOS.map((name) => createRow(name, globalCost, globalFabric));
    setRows(newRows);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const lines = e.clipboardData.getData("text").split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setRows(lines.map((name) => createRow(name, globalCost, globalFabric)));
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.name.trim());
    if (!valid.length) { alert("Adicione pelo menos um produto com nome."); return; }

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
  const validCount = rows.filter((r) => r.name.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar produtos</h1>
          <p className="mt-1 text-sm text-slate-500">Adicione vários produtos de uma só vez.</p>
        </div>
        <Link href="/admin/produtos" className="btn-outline px-4 py-2 text-sm rounded-lg">Voltar</Link>
      </div>

      {/* ATALHOS GLOBAIS */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Aplicar para todos</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* PREÇO COM MARGEM */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Preço de custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={globalCost}
                  onChange={(e) => setGlobalCost(e.target.value)}
                  className={input}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Venda (+30%)</label>
                <input
                  readOnly
                  value={globalCost ? calcSalePrice(globalCost) : ""}
                  placeholder="0.00"
                  className={`${input} bg-slate-50 cursor-default`}
                />
              </div>
            </div>
            <button type="button" onClick={applyGlobalCost} className="btn-outline px-4 py-2 text-sm rounded-lg w-full">
              Aplicar preço para todos
            </button>
          </div>

          {/* CATEGORIA */}
          <div className="space-y-2">
            <label className="block text-xs text-slate-500 mb-1">Categoria padrão</label>
            <select value={globalFabric} onChange={(e) => setGlobalFabric(e.target.value)} className={input}>
              <option value="">Selecione</option>
              {FABRIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={applyGlobalFabric} className="btn-outline px-4 py-2 text-sm rounded-lg w-full">
              Aplicar categoria para todos
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={loadSuggested} className="btn-outline px-4 py-2 text-sm rounded-lg">
            📋 Carregar lista sugerida ({PRODUTOS_SUGERIDOS.length} produtos)
          </button>
          <button type="button" onClick={addRow} className="btn-outline px-4 py-2 text-sm rounded-lg">
            + Adicionar linha
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">Ou cole uma lista de nomes (um por linha):</p>
          <textarea
            placeholder={"Tricoline Estampado\nTricoline Liso\nCetim com Elastano"}
            onPaste={handlePaste}
            rows={3}
            className={`${input} resize-none`}
          />
        </div>
      </div>

      {/* TABELA */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 w-8">#</th>
                <th className="px-3 py-3">Nome do produto</th>
                <th className="px-3 py-3 w-36">Custo (R$)</th>
                <th className="px-3 py-3 w-36">Venda (+30%)</th>
                <th className="px-3 py-3 w-48">Categoria</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-400 text-xs">{index + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      placeholder="Nome do produto"
                      className={input}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.cost_price}
                      onChange={(e) => updateRow(row.id, "cost_price", e.target.value)}
                      placeholder="0.00"
                      className={input}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.price_per_meter}
                      onChange={(e) => updateRow(row.id, "price_per_meter", e.target.value)}
                      placeholder="0.00"
                      className={`${input} bg-slate-50`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.fabric_type}
                      onChange={(e) => updateRow(row.id, "fabric_type", e.target.value)}
                      className={input}
                    >
                      <option value="">Selecione</option>
                      {FABRIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-600 transition text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORTAR */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={handleImport} disabled={importing} className="btn-primary px-6 py-3 disabled:opacity-50">
          {importing ? "Importando..." : `Importar ${validCount} produto${validCount !== 1 ? "s" : ""}`}
        </button>
        <span className="text-sm text-slate-500">{validCount} produtos prontos</span>
      </div>

      {/* RESULTADOS */}
      {results && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Resultado</h2>
            <span className="rounded-full px-3 py-1 text-xs font-medium text-green-700 bg-green-100">{successCount} importados</span>
            {errorCount > 0 && <span className="rounded-full px-3 py-1 text-xs font-medium text-red-700 bg-red-100">{errorCount} erros</span>}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm px-4 py-2 rounded-lg ${r.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <span>{r.success ? "✓" : "✗"}</span>
                <span className="flex-1">{r.name}</span>
                {r.error && <span className="text-xs opacity-70">{r.error}</span>}
              </div>
            ))}
          </div>

          {successCount > 0 && (
            <div className="flex gap-3 pt-2">
              <Link href="/admin/produtos" className="btn-primary px-4 py-2">Ver produtos</Link>
              <button type="button" onClick={() => { setResults(null); setRows([createRow()]); }} className="btn-outline px-4 py-2">Nova importação</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
