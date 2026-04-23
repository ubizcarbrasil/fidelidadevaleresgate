/**
 * FeatureToggle — Sprint 3
 * Toggle compacto para uma feature do Duelo (cinturao | aposta | ranking).
 * Lê via useBrandFeature e escreve via useSetBrandDueloFeature.
 */
import { Switch } from "@/components/ui/switch";
import {
  useBrandFeature,
  useSetBrandDueloFeature,
  type DueloBrandFeature,
} from "@/compartilhados/hooks/hook_brand_feature";

interface Props {
  brandId: string;
  feature: DueloBrandFeature;
  label: string;
  description?: string;
}

export default function FeatureToggle({
  brandId,
  feature,
  label,
  description,
}: Props) {
  const { data: enabled, isLoading } = useBrandFeature(brandId, feature);
  const setFeature = useSetBrandDueloFeature();

  const handleChange = (checked: boolean) => {
    setFeature.mutate({ brandId, feature, enabled: checked });
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-medium leading-none">{label}</p>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={!!enabled}
        onCheckedChange={handleChange}
        disabled={isLoading || setFeature.isPending}
      />
    </div>
  );
}