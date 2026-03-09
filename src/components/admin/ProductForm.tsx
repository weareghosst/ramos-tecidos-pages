import { useState } from "react";
import { useRouter } from "next/router";
import { Product, ProductVariant } from "../../types/catalog";

type Props = {
  initialData?: Product | null;
};

type UploadState = {
  [key: number]: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toSafeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductForm({ initialData }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [pricePerMeter, setPricePerMeter] = useState(
    initialData?.price_per_meter?.toString() || ""
  );
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [fabricType, setFabricType] = useState(
    (initialData as any)?.fabric_type || ""
  );
  const [active, setActive] = useState(initialData?.active ?? true);
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants?.length
      ? initialData.variants
      : [
          {
            color_name: "",
            color_hex: "#e2e8f0",
            image_url: "",
            stock_meters: 0,
            active: true,
          },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadState>({});

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | number | boolean | null
  ) => {
    const next = [...variants];
    next[index] = {
      ...next[index],
      [field]: value,
    };
    setVariants(next);
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        color_name: "",
        color_hex: "#e2e8f0",
        image_url: "",
        stock_meters: 0,
        active: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadVariantImage = async (index: number, file?: File) => {
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [index]: true }));

      const base64 = await fileToBase64(file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileBase64: base64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro no upload");
      }

      updateVariant(index, "image_url", data.url);
    } catch (error: any) {
      console.error("Erro ao enviar imagem da variante:", error);
      alert(error?.message || "Erro ao enviar imagem da variante.");
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!pricePerMeter || toSafeNumber(pricePerMeter) <= 0) {
      alert("Informe um preço por metro válido.");
      return;
    }

    const validVariants = variants
      .filter((v) => v.color_name.trim())
      .map((v) => ({
        id: v.id,
        color_name: v.color_name.trim(),
        color_hex: v.color_hex || null,
        image_url: v.image_url || null,
        stock_meters: toSafeNumber(v.stock_meters),
        active: Boolean(v.active),
      }));

    if (!validVariants.length) {
      alert("Cadastre pelo menos uma cor.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug) : slugify(name),
        description: description.trim() || null,
        price_per_meter: toSafeNumber(pricePerMeter),
        image_url: imageUrl.trim() || null,
        fabric_type: fabricType || null,
        active,
        variants: validVariants,
      };

      console.log("Payload enviado:", payload);

      const isEdit = Boolean(initialData?.id);
      const url = isEdit
        ? `/api/admin/products/${initialData?.id}`
        : "/api/admin/products";

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      console.log("Resposta da API:", {
        status: res.status,
        ok: res.ok,
        data,
      });

      if (!res.ok) {
        throw new Error(data?.error || `Erro ao salvar produto (HTTP ${res.status})`);
      }

      router.push("/admin/produtos");
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      alert(error?.message || "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="card p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {initialData ? "Editar produto" : "Novo produto"}
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initialData) {
                  setSlug(slugify(e.target.value));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo do tecido</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Tricoline Lisa">Tricoline Lisa</option>
              <option value="Tricoline Estampada">Tricoline Estampada</option>
              <option value="Tricoline Digital">Tricoline Digital</option>
              <option value="Malhas">Malhas</option>
              <option value="Mantas e Fibras">Mantas e Fibras</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preço por metro</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={pricePerMeter}
              onChange={(e) => setPricePerMeter(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Imagem principal (URL)</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <label htmlFor="active" className="text-sm font-medium">
              Produto ativo
            </label>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cores / variantes</h2>

          <button
            type="button"
            onClick={addVariant}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            + Nova cor
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {variants.map((variant, index) => (
            <div
              key={variant.id || index}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da cor</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    value={variant.color_name}
                    onChange={(e) =>
                      updateVariant(index, "color_name", e.target.value)
                    }
                    placeholder="Ex.: Azul Marinho"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hex da cor</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={variant.color_hex || "#e2e8f0"}
                      onChange={(e) =>
                        updateVariant(index, "color_hex", e.target.value)
                      }
                      className="h-12 w-16 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3"
                      value={variant.color_hex || ""}
                      onChange={(e) =>
                        updateVariant(index, "color_hex", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estoque (metros)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    value={variant.stock_meters}
                    onChange={(e) =>
                      updateVariant(index, "stock_meters", Number(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium">Imagem da cor (URL)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    value={variant.image_url || ""}
                    onChange={(e) =>
                      updateVariant(index, "image_url", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium">Upload da imagem da cor</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleUploadVariantImage(index, e.target.files?.[0])
                    }
                  />
                  {uploading[index] ? (
                    <p className="text-sm text-slate-500">Enviando imagem...</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id={`variant-active-${index}`}
                    type="checkbox"
                    checked={variant.active}
                    onChange={(e) =>
                      updateVariant(index, "active", e.target.checked)
                    }
                  />
                  <label
                    htmlFor={`variant-active-${index}`}
                    className="text-sm font-medium"
                  >
                    Cor ativa
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remover cor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-5 py-3 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar produto"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/produtos")}
          className="btn-outline px-5 py-3"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}