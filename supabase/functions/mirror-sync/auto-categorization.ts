// Pós-sync: classifica ofertas em categorias, ativa categorias com volume
// suficiente, desativa as fracas (movendo seus deals pra "Ofertas Variadas").

import { matchDealToCategory } from "./category-matcher.ts";
import type { DealCategory } from "./types.ts";

const MIN_DEALS_PER_CATEGORY = 4;

export async function runAutoCategorization(supabase: any, brandId: string, originFilter: string) {
  const catStats = {
    matched_by_keywords: 0,
    sent_to_variadas: 0,
    categories_activated: [] as string[],
    categories_deactivated: [] as string[],
    deals_moved_to_variadas: 0,
  };

  const { data: allCategories } = await supabase
    .from("affiliate_deal_categories")
    .select("id, name, keywords, is_active")
    .eq("brand_id", brandId);

  const categories: DealCategory[] = allCategories || [];

  const { data: allDeals } = await supabase
    .from("affiliate_deals")
    .select("id, title, description, category, store_name, category_id, is_active")
    .eq("brand_id", brandId)
    .eq("origin", originFilter)
    .eq("is_active", true);

  const deals = allDeals || [];

  const categoryUpdates = new Map<string, string[]>();

  for (const deal of deals) {
    const matchedCatId = matchDealToCategory(
      deal.title,
      deal.description,
      deal.category,
      deal.store_name,
      categories
    );
    if (matchedCatId) {
      catStats.matched_by_keywords++;
      if (!categoryUpdates.has(matchedCatId)) categoryUpdates.set(matchedCatId, []);
      categoryUpdates.get(matchedCatId)!.push(deal.id);
    }
  }

  for (const [catId, dealIds] of categoryUpdates) {
    await supabase
      .from("affiliate_deals")
      .update({ category_id: catId })
      .in("id", dealIds);
  }

  const { data: refreshedDeals } = await supabase
    .from("affiliate_deals")
    .select("id, category_id")
    .eq("brand_id", brandId)
    .eq("origin", originFilter)
    .eq("is_active", true);

  const countByCategory = new Map<string, number>();
  const dealsByCategory = new Map<string, string[]>();
  const uncategorized: string[] = [];

  for (const d of refreshedDeals || []) {
    if (d.category_id) {
      countByCategory.set(d.category_id, (countByCategory.get(d.category_id) || 0) + 1);
      if (!dealsByCategory.has(d.category_id)) dealsByCategory.set(d.category_id, []);
      dealsByCategory.get(d.category_id)!.push(d.id);
    } else {
      uncategorized.push(d.id);
    }
  }

  for (const cat of categories) {
    const count = countByCategory.get(cat.id) || 0;
    if (!cat.is_active && count >= MIN_DEALS_PER_CATEGORY) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: true })
        .eq("id", cat.id);
      catStats.categories_activated.push(cat.name);
    }
  }

  for (const cat of categories) {
    if (cat.name === "Ofertas Variadas") continue;
    const count = countByCategory.get(cat.id) || 0;
    if (cat.is_active && count < MIN_DEALS_PER_CATEGORY && count > 0) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: false })
        .eq("id", cat.id);
      catStats.categories_deactivated.push(cat.name);

      const idsToMove = dealsByCategory.get(cat.id) || [];
      if (idsToMove.length > 0) {
        await supabase
          .from("affiliate_deals")
          .update({ category_id: null })
          .in("id", idsToMove);
        uncategorized.push(...idsToMove);
        catStats.deals_moved_to_variadas += idsToMove.length;
      }
    }
  }

  let variadasId: string | null = null;
  const existing = categories.find((c) => c.name === "Ofertas Variadas");
  if (existing) {
    variadasId = existing.id;
    if (!existing.is_active) {
      await supabase
        .from("affiliate_deal_categories")
        .update({ is_active: true })
        .eq("id", existing.id);
    }
  } else {
    const maxOrder = categories.reduce((m, _c) => Math.max(m, 0), 0);
    const { data: created } = await supabase
      .from("affiliate_deal_categories")
      .insert({
        brand_id: brandId,
        name: "Ofertas Variadas",
        icon_name: "Package",
        color: "#6b7280",
        order_index: maxOrder + 1,
        is_active: true,
        keywords: [],
      })
      .select("id")
      .single();
    variadasId = created?.id || null;
  }

  if (variadasId && uncategorized.length > 0) {
    catStats.sent_to_variadas = uncategorized.length;
    for (let i = 0; i < uncategorized.length; i += 100) {
      const chunk = uncategorized.slice(i, i + 100);
      await supabase
        .from("affiliate_deals")
        .update({ category_id: variadasId })
        .in("id", chunk);
    }
  }

  return catStats;
}
