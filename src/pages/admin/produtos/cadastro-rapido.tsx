import { useState, useRef } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const FABRIC_TYPES = [
  "Tricoline Lisa", "Tricoline Estampada", "Tricoline Digital",
  "Malhas", "Mantas e Fibras", "Outros",
];

const COLOR_MAP: Record<string, string> = {
  branco: "#ffffff", branca: "#ffffff",
  preto: "#1a1a1a", preta: "#1a1a1a",
  cinza: "#9ca3af", "cinza-claro": "#d1d5db", "cinza-escuro": "#4b5563",
  vermelho: "#ef4444", vermelha: "#ef4444",
  azul: "#3b82f6", "azul-royal": "#1e3a8a", "azul-marinho": "#1e3a8a",
  "azul-claro": "#93c5fd", "azul-bebe": "#bfdbfe",
  verde: "#22c55e", "verde-escuro": "#15803d", "verde-claro": "#86efac",
  "verde-militar": "#4d7c0f",
  amarelo: "#facc15", amarela: "#facc15", "amarelo-neon": "#fde047",
  laranja: "#f97316",
  rosa: "#f472b6", "rosa-claro": "#fbcfe8", "rosa-escuro": "#db2777",
  "rosa-bebe": "#fce7f3",
  roxo: "#a855f7", lilas: "#c084fc", violeta: "#8b5cf6",
  marrom: "#92400e", caramelo: "#d97706", bege: "#f5f0e8",
  dourado: "#f59e0b", dourada: "#f59e0b",
  prata: "#cbd5e1", nude: "#e8c9a0", coral: "#fb7185",
  vinho: "#7f1d1d", musgo: "#4a7c59",
  terracota: "#c2714f", marsala: "#955251", salmao: "#fca089",
};

function guessHex(filename: string): string {
  const base = filename.toLowerCase().replace(/\.[^.]+$/, "").replace(/[\s_]/g, "-");
  if (COLOR_MAP[base]) return COLOR_MAP[base];
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (base.includes(key)) return hex;
  }
  return "#e2e8f0";
}

function formatColorName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function calcSale(cost: string): string {
  const n = Number(cost.replace(",", "."));
  return n > 0 ? (n * 1.3).toFixed(2) : "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type VariantPreview = {
  file: File;
  previewUrl: string;
  colorName: string;
  colorHex: string;
  stockMeters: string;
  uploading: boolean;
  uploadedUrl: string;
  error: string;
};

const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";
const label = "block text-xs font-medium text-slate-500 mb-1";

export default function CadastroRapido() {
  const { checking, authenticated } = useAdminAuth();

  const [productName, setProductName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<VariantPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedId, setSavedId] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  function handleCostChange(val: string) {
    setCostPrice(val);
    setSalePrice(calcSale(val));
  }

  function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!files.length) return;

    // tenta pegar nome do produto pela pasta
    const firstPath = files[0].webkitRelativePath || "";
    if (firstPath && !productName) {
      const folderName = firstPath.split("/")[0];
      setProductName(
        folderName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
    }

    const previews: VariantPreview[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      colorName: formatColorName(file.name),
      colorHex: guessHex(file.name),
      stockMeters: "1000",
      uploading: false,
      uploadedUrl: "",
      error: "",
    }));

    setVariants(previews);
    setDone(false);
  }

  function updateVariant(index: number, field: keyof VariantPreview, value: string) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAll() {
    const updated = [...variants];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].uploadedUrl) continue;
      updated[i] = { ...updated[i], uploading: true, error: "" };
      setVariants([...updated]);

      try {
        const base64 = await fileToBase64(updated[i].file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: updated[i].file.name,
            contentType: updated[i].file.type,
            fileBase64: base64,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erro no upload");
        updated[i] = { ...updated[i], uploading: false, uploadedUrl: data.url };
      } catch (err: any) {
        updated[i] = { ...updated[i], uploading: false, error: err?.message || "Erro" };
      }

      setVariants([...updated]);
    }
    return updated;
  }

  async function handleSave() {
    if (!productName.trim()) { alert("Informe o nome do produto."); return; }
    if (!salePrice || Number(salePrice) <= 0) { alert("Informe o preço de venda."); return; }
    if (!variants.length) { alert("Selecione uma pasta com imagens."); return; }

    setSaving(true);
    try {
      // 1. faz upload de todas as imagens
      const uploaded = await uploadAll();

      const hasError = uploaded.some((v) => v.error);
      if (hasError) {
        alert("Algumas imagens falharam no upload. Verifique os erros e tente novamente.");
        setSaving(false);
        return;
      }

      // 2. monta payload e salva o produto
      const variantsPayload = uploaded.map((v) => ({
        color_name: v.colorName,
        color_hex: v.colorHex,
        image_url: v.uploadedUrl,
        stock_meters: Number(v.stockMeters) || 0,
        active: true,
      }));

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          slug: "",
          description: description.trim() || null,
          price_per_meter: Number(salePrice),
          image_url: uploaded[0]?.uploadedUrl || null,
          fabric_type: fabricType || null,
          active: true,
          variants: variantsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar produto");

      setSavedId(data.id || "");
      setDone(true);
    } catch (err: any) {
      alert(err?.message || "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setProductName("");
    setCostPrice("");
    setSalePrice("");
    setFabricType("");
    setDescription("");
    setVariants([]);
    setDone(false);
    setSavedId("");
    if (folderInputRef.current) folderInputRef.current.value = "";
  }

  const uploadedCount = variants.filter((v) => v.uploadedUrl).length;
  const uploadingCount = variants.filter((v) => v.uploading).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro rápido por pasta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecione uma pasta com as imagens nomeadas pela cor. O sistema cria as variantes automaticamente.
          </p>
        </div>
        <Link href="/admin/produtos" className="btn-outline px-4 py-2 text-sm rounded-lg">Voltar</Link>
      </div>

      {done ? (
        <div className="card p-8 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold">Produto cadastrado com sucesso!</h2>
          <p className="text-slate-500">{productName} com {variants.length} cor{variants.length !== 1 ? "es" : ""}</p>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={reset} className="btn-primary px-5 py-2">Cadastrar outro</button>
            <Link href="/admin/produtos" className="btn-outline px-5 py-2">Ver produtos</Link>
            {savedId && (
              <Link href={`/admin/produtos/${savedId}`} className="btn-outline px-5 py-2">Editar produto</Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* PASSO 1 — PASTA */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              1. Selecione a pasta de imagens
            </h2>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
              onClick={() => folderInputRef.current?.click()}
            >
              {variants.length === 0 ? (
                <>
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-slate-600 font-medium">Clique para selecionar a pasta</p>
                  <p className="text-sm text-slate-400 mt-1">
                    As imagens devem estar nomeadas pela cor (ex: azul-marinho.jpg)
                  </p>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">✓</div>
                  <p className="text-slate-600 font-medium">{variants.length} imagens carregadas</p>
                  <p className="text-sm text-slate-400 mt-1">Clique para trocar a pasta</p>
                </>
              )}
            </div>
            <input
              ref={folderInputRef}
              type="file"
              accept="image/*"
              multiple
              // @ts-ignore
              webkitdirectory=""
              className="hidden"
              onChange={handleFolderSelect}
            />
          </div>

          {/* PASSO 2 — DADOS DO PRODUTO */}
          {variants.length > 0 && (
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                2. Dados do produto
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={label}>Nome do produto</label>
                  <input className={input} value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex.: Tactel 2 Cabos" />
                </div>

                <div>
                  <label className={label}>Tipo do tecido</label>
                  <select className={input} value={fabricType} onChange={(e) => setFabricType(e.target.value)}>
                    <option value="">Selecione</option>
                    {FABRIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label}>Preço de custo (R$)</label>
                    <input type="number" step="0.01" className={input} value={costPrice} onChange={(e) => handleCostChange(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={label}>Venda (+30%)</label>
                    <input type="number" step="0.01" className={`${input} bg-slate-50`} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className={label}>Descrição (opcional)</label>
                  <textarea className={`${input} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3 — VARIANTES */}
          {variants.length > 0 && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  3. Cores detectadas ({variants.length})
                </h2>
                {uploadedCount > 0 && (
                  <span className="text-xs text-green-600">{uploadedCount} imagens enviadas</span>
                )}
              </div>

              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3">
                    {/* preview */}
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={v.previewUrl} alt={v.colorName} className="h-full w-full object-cover" />
                    </div>

                    {/* nome da cor */}
                    <div className="flex-1 min-w-0">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                        value={v.colorName}
                        onChange={(e) => updateVariant(i, "colorName", e.target.value)}
                      />
                    </div>

                    {/* hex */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
                        className="h-8 w-8 rounded border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400"
                        value={v.colorHex}
                        onChange={(e) => updateVariant(i, "colorHex", e.target.value)}
                      />
                    </div>

                    {/* estoque */}
                    <div className="w-24 flex-shrink-0">
                      <input
                        type="number"
                        step="0.5"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center outline-none focus:border-slate-400"
                        value={v.stockMeters}
                        onChange={(e) => updateVariant(i, "stockMeters", e.target.value)}
                        title="Estoque (m)"
                      />
                    </div>

                    {/* status */}
                    <div className="w-20 text-center flex-shrink-0">
                      {v.uploading && <span className="text-xs text-slate-400 animate-pulse">Enviando...</span>}
                      {v.uploadedUrl && !v.uploading && <span className="text-xs text-green-600">✓ Enviado</span>}
                      {v.error && <span className="text-xs text-red-500" title={v.error}>✗ Erro</span>}
                    </div>

                    {/* remover */}
                    <button type="button" onClick={() => removeVariant(i)} className="text-slate-400 hover:text-red-500 text-lg flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SALVAR */}
          {variants.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary px-6 py-3 disabled:opacity-50"
              >
                {saving
                  ? uploadingCount > 0
                    ? `Enviando imagens... (${uploadedCount}/${variants.length})`
                    : "Salvando produto..."
                  : `Cadastrar produto com ${variants.length} cor${variants.length !== 1 ? "es" : ""}`}
              </button>
              <button type="button" onClick={reset} className="btn-outline px-4 py-2 text-sm">Limpar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
