import { ProductVariant } from "../../types/catalog";

type Props = {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ProductVariant) => void;
};

export default function ColorSelector({
  variants,
  selectedVariantId,
  onSelect,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">Cor</p>

      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                isSelected
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              title={variant.color_name}
            >
              <span
                className="h-5 w-5 rounded-full border border-slate-300"
                style={{
                  backgroundColor: variant.color_hex || "#e2e8f0",
                }}
              />
              <span className="text-sm text-slate-700">{variant.color_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}