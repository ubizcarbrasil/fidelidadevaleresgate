import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";

/**
 * Auto-seeds demo stores for a brand on first customer visit
 * if stores exist but none have taxonomy_segment_id linked.
 * Sets a flag in brand_settings_json to avoid re-triggering.
 */
export function useAutoSeedDemo(brandId: string | undefined, branchId: string | undefined) {
  const triggered = useRef(false);
  const { brand } = useBrand();
  const ctxSettings = (brand?.brand_settings_json as Record<string, unknown> | null) || null;
  const ctxAutoSeedDone = ctxSettings?.auto_seed_done === true;

  useEffect(() => {
    if (!brandId || !branchId || triggered.current) return;

    // Atalho: se o BrandContext já carregou as settings e elas indicam
    // auto_seed_done = true, evitamos as 3 requisições extras (brands +
    // 2x stores HEAD) que rodavam em todo boot.
    if (ctxAutoSeedDone) {
      triggered.current = true;
      return;
    }

    const check = async () => {
      triggered.current = true;

      // Only run if there's an authenticated session (edge function requires auth)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if auto-seed already ran via brand_settings_json flag
      const { data: brand } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .single();

      const settings = (brand?.brand_settings_json as Record<string, unknown>) || {};
      if (settings.auto_seed_done) return;

      // Check if stores exist but none have taxonomy linked
      const { count: totalStores } = await supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .eq("is_active", true);

      if (!totalStores || totalStores === 0) return;

      const { count: withTaxonomy } = await supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .not("taxonomy_segment_id", "is", null);

      // If most stores already have taxonomy, skip
      if (withTaxonomy && withTaxonomy > totalStores * 0.5) {
        // Mark as done so we don't check again
        await supabase
          .from("brands")
          .update({ brand_settings_json: { ...settings, auto_seed_done: true } })
          .eq("id", brandId);
        return;
      }

      // Trigger seed-demo-stores to link taxonomy + create sections
      try {
        await supabase.functions.invoke("seed-demo-stores", {
          body: { brand_id: brandId, branch_id: branchId },
        });

        // Mark as done
        await supabase
          .from("brands")
          .update({ brand_settings_json: { ...settings, auto_seed_done: true } })
          .eq("id", brandId);
      } catch {
        // Silent fail — will retry next visit
      }
    };

    check();
  }, [brandId, branchId, ctxAutoSeedDone]);
}
