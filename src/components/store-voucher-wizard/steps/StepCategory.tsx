import { StoreVoucherData, CATEGORY_OPTIONS } from "../types";
import { Label } from "@/components/ui/label";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepCategory({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Categoria do Cupom</Label>
      <p className="text-sm text-muted-foreground">Segmente o perfil do cupom para filtros e público-alvo.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => update({ coupon_category: cat })}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              data.coupon_category === cat
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
