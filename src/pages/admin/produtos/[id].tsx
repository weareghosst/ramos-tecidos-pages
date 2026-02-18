import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditarProduto() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/products/${id}`)
      .then((res) => res.json())
      .then((data) => setForm(data.product));
  }, [id]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;

    setForm((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price_per_meter: Number(form.price_per_meter),
        stock_meters: Number(form.stock_meters),
      }),
    });

    setLoading(false);
    router.push("/admin/produtos");
  }

  async function handleDelete() {
    if (!confirm("Deseja excluir este produto?")) return;

    await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    router.push("/admin/produtos");
  }

  if (!form) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Editar Produto</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">

        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Descrição</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Preço por metro</label>
            <input
              name="price_per_meter"
              type="number"
              step="0.01"
              value={form.price_per_meter}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Estoque (metros)</label>
            <input
              name="stock_meters"
              type="number"
              step="0.5"
              value={form.stock_meters}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />
          <label className="text-sm">Produto ativo</label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="btn-outline w-full"
          >
            Excluir
          </button>
        </div>

      </form>
    </div>
  );
}
