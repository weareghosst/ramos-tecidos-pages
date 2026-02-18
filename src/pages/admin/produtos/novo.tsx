import { useState } from "react";
import { useRouter } from "next/router";
import { supabaseClient } from "@/lib/supabaseClient";

export default function NovoProduto() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price_per_meter: "",
    stock_meters: "",
    active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    let image_url = null;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("products")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Erro ao fazer upload");
        setLoading(false);
        return;
      }

      const { data } = supabaseClient.storage
        .from("products")
        .getPublicUrl(fileName);

      image_url = data.publicUrl;
    }

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price_per_meter: Number(form.price_per_meter),
        stock_meters: Number(form.stock_meters),
        image_url,
      }),
    });

    if (res.ok) {
      router.push("/admin/produtos");
    } else {
      alert("Erro ao criar produto");
    }

    setLoading(false);
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Novo Produto</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-xl">
        <input name="name" placeholder="Nome" onChange={handleChange} className="input" />
        <input name="slug" placeholder="Slug" onChange={handleChange} className="input" />
        <textarea name="description" placeholder="Descrição" onChange={handleChange} className="input" />

        <input name="price_per_meter" placeholder="Preço por metro" onChange={handleChange} className="input" />
        <input name="stock_meters" placeholder="Estoque" onChange={handleChange} className="input" />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
          Produto ativo
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Salvando..." : "Criar produto"}
        </button>
      </form>
    </div>
  );
}
