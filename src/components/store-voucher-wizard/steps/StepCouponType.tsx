import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Store, Package } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
  catalogItems: { id: string; name: string; price: number }[];
}

export default function StepCouponType({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Tipo do Cupom</Label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => update({ coupon_type: "STORE", product_id: "", product_title: "", product_description: "", product_price: 0 })}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${
            data.coupon_type === "STORE"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Store className="h-8 w-8" />
          <span className="font-semibold">Loja Toda</span>
          <span className="text-xs text-muted-foreground text-center">Cupom válido para qualquer produto/serviço</span>
        </button>
        <button
          type="button"
          onClick={() => update({ coupon_type: "PRODUCT" })}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors ${
            data.coupon_type === "PRODUCT"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Package className="h-8 w-8" />
          <span className="font-semibold">Produto Específico</span>
          <span className="text-xs text-muted-foreground text-center">Defina o produto diretamente</span>
        </button>
      </div>

      {data.coupon_type === "PRODUCT" && (
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-sm font-semibold">Dados do Produto</Label>
          <div className="space-y-2">
            <Label className="text-xs">Nome do produto</Label>
            <Input
              value={data.product_title}
              onChange={(e) => update({ product_title: e.target.value })}
              placeholder="Ex: Combo de sushi 500g"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={data.product_description}
              onChange={(e) => update({ product_description: e.target.value })}
              placeholder="Ex: Combinado especial de 30 peças variadas"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Valor do produto (R$)</Label>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-muted-foreground">R$</span>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={data.product_price}
                onChange={(e) => update({ product_price: Number(e.target.value) })}
                className="text-lg font-bold max-w-[140px]"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
