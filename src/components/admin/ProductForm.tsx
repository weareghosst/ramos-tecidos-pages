import { useState } from "react";
import { useRouter } from "next/router";
import { Product, ProductVariant } from "../../types/catalog";

type Props = { initialData?: Product | null };
type UploadState = { [key: number]: boolean };

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toSafeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// mapa de nomes de cores comuns → hex
const COLOR_MAP: Record<string, string> = {
  branco: "#ffffff", branca: "#ffffff",
  preto: "#1a1a1a", preta: "#1a1a1a",
  cinza: "#9ca3af", "cinza claro": "#d1d5db", "cinza escuro": "#4b5563",
  vermelho: "#ef4444", vermelha: "#ef4444",
  azul: "#3b82f6", "azul royal": "#1e3a8a", "azul marinho": "#1e3a8a", "azul claro": "#93c5fd", "azul bebe": "#bfdbfe",
  verde: "#22c55e", "verde escuro": "#15803d", "verde claro": "#86efac", "verde militar": "#4d7c0f",
  amarelo: "#facc15", amarela: "#facc15", "amarelo neon": "#fde047",
  laranja: "#f97316",
  rosa: "#f472b6", "rosa claro": "#fbcfe8", "rosa escuro": "#db2777", "rosa bebe": "#fce7f3",
  roxo: "#a855f7", "lilás": "#c084fc", lilas: "#c084fc", violeta: "#8b5cf6",
  marrom: "#92400e", caramelo: "#d97706", bege: "#f5f0e8",
  dourado: "#f59e0b", dourada: "#f59e0b",
  prata: "#cbd5e1",
  nude: "#e8c9a0",
  coral: "#fb7185",
  vinho: "#7f1d1d",
  musgo: "#4a7c59",
  terracota: "#c2714f", "terra cota": "#c2714f",
  marsala: "#955251",
  "salmão": "#fca089", salmao: "#fca089",
};

function guessColorHex(name: string): string | null {
  if (!name.trim()) return null;
  const lower = name.toLowerCase().trim();

  // busca exata
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];

  // busca parcial — verifica se alguma chave está contida no nome
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }

  return null;
}

const FABRIC_TYPES = [
  "Tricoline Lisa", "Tricoline Estampada", "Tricoline Digital",
  "Malhas", "Mantas e Fibras", "Outros",
];

const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";
const label = "block text-xs font-medium text-slate-600 mb-1";

export default function ProductForm({ initialData }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [pricePerMeter, setPricePerMeter] = useState(initialData?.price_per_meter?.toString() || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [fabricType, setFabricType] = useState((initialData as any)?.fabric_type || "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants?.length ? initialData.variants : [{ color_name: "", color_hex: "#e2e8f0", image_url: "", stock_meters: 0, active: true }]
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadState>({});

  function updateVariant(index: number, field: keyof ProductVariant, value: string | number | boolean | null) {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };

    // ao atualizar nome da cor, tenta adivinhar o hex automaticamente
    if (field === "color_name" && typeof value === "string") {
      const guessed = guessColorHex(value);
      if (guessed) next[index].color_hex = guessed;
    }

    setVariants(next);
  }

  function addVariant() {
    setVariants((prev) => [...prev, { color_name: "", color_hex: "#e2e8f0", image_url: "", stock_meters: 0, active: true }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadVariantImage(index: number, file?: File) {
    if (!file) return;
    try {
      setUploading((prev) => ({ ...prev, [index]: true }));
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, fileBase64: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro no upload");
      updateVariant(index, "image_url", data.url);
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar imagem.");
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { alert("Informe o nome do produto."); return; }
    if (!pricePerMeter || toSafeNumber(pricePerMeter) <= 0) { alert("Informe um preço por metro válido."); return; }

    const validVariants = variants.filter((v) => v.color_name.trim()).map((v) => ({
      id: v.id,
      color_name: v.color_name.trim(),
      color_hex: v.color_hex || null,
      image_url: v.image_url || null,
      stock_meters: toSafeNumber(v.stock_meters),
      active: Boolean(v.active),
    }));

    if (!validVariants.length) { alert("Cadastre pelo menos uma cor."); return; }

    setSaving(true);
    try {
      const isEdit = Boolean(initialData?.id);
      const res = await fetch(
        isEdit ? `/api/admin/products/${initialData?.id}` : "/api/admin/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() ? slugify(slug) : slugify(name),
            description: description.trim() || null,
            price_per_meter: toSafeNumber(pricePerMeter),
            image_url: imageUrl.trim() || null,
            fabric_type: fabricType || null,
            active,
            variants: validVariants,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Erro ao salvar (HTTP ${res.status})`);
      router.push("/admin/produtos");
    } catch (error: any) {
      alert(error?.message || "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {initialData ? "Editar produto" : "Novo produto"}
        </h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/admin/produtos")} className="btn-outline px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </div>

      {/* DADOS PRINCIPAIS */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Informações</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Nome</label>
            <input className={input} value={name} onChange={(e) => { setName(e.target.value); if (!initialData) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input className={input} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Tipo do tecido</label>
            <select className={input} value={fabricType} onChange={(e) => setFabricType(e.target.value)}>
              <option value="">Selecione</option>
              {FABRIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Preço por metro (R$)</label>
            <input type="number" step="0.01" className={input} value={pricePerMeter} onChange={(e) => setPricePerMeter(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className={label}>Imagem principal (URL)</label>
          <input className={input} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <label className={label}>Descrição</label>
          <textarea className={`${input} min-h-[80px] resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="text-slate-700">Produto ativo</span>
        </label>
      </div>

      {/* VARIANTES */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cores / variantes</h2>
          <button type="button" onClick={addVariant} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition">+ Nova cor</button>
        </div>

        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id || index} className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Nome da cor</label>
                  <input
                    className={input}
                    value={variant.color_name}
                    onChange={(e) => updateVariant(index, "color_name", e.target.value)}
                    placeholder="Ex.: Azul Marinho"
                  />
                  {variant.color_name && guessColorHex(variant.color_name) && (
                    <p className="text-xs text-slate-400 mt-1">✓ Cor detectada automaticamente</p>
                  )}
                </div>

                <div>
                  <label className={label}>Cor (hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={variant.color_hex || "#e2e8f0"}
                      onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                      className="h-9 w-10 rounded-lg border border-slate-200 bg-white cursor-pointer p-0.5"
                    />
                    <input
                      className={`${input} flex-1`}
                      value={variant.color_hex || ""}
                      onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Estoque (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={input}
                    value={variant.stock_meters}
                    onChange={(e) => updateVariant(index, "stock_meters", Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className={label}>Imagem da cor (URL)</label>
                <input
                  className={input}
                  value={variant.image_url || ""}
                  onChange={(e) => updateVariant(index, "image_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(e) => updateVariant(index, "active", e.target.checked)}
                    />
                    <span className="text-slate-600 text-xs">Cor ativa</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadVariantImage(index, e.target.files?.[0])}
                    />
                    {uploading[index] ? "Enviando..." : "📎 Upload imagem"}
                  </label>
                </div>

                <button type="button" onClick={() => removeVariant(index)} className="text-xs text-red-500 hover:text-red-700">
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </form>
  );
}
