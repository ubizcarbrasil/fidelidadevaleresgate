import { supabase } from "@/integrations/supabase/client";

/**
 * Records a billing event for the Ganha-Ganha module if the module is active for the brand.
 * Should be called after earning points or processing a redemption.
 */
export async function recordGanhaGanhaBillingEvent(params: {
  brandId: string;
  storeId: string;
  eventType: "EARN" | "REDEEM";
  pointsAmount: number;
  referenceId: string;
  referenceType: "EARNING_EVENT" | "REDEMPTION";
}) {
  const { brandId, storeId, eventType, pointsAmount, referenceId, referenceType } = params;

  // Check if GG is active for this brand
  const { data: config } = await supabase
    .from("ganha_ganha_config")
    .select("is_active, fee_per_point_earned, fee_per_point_redeemed, fee_mode")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .maybeSingle();

  if (!config) return; // Module not active

  // Determine fee
  let feePerPoint = eventType === "EARN"
    ? Number(config.fee_per_point_earned)
    : Number(config.fee_per_point_redeemed);

  // Check for custom store fee
  if (config.fee_mode === "CUSTOM") {
    const { data: customFee } = await supabase
      .from("ganha_ganha_store_fees")
      .select("fee_per_point_earned, fee_per_point_redeemed")
      .eq("brand_id", brandId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (customFee) {
      feePerPoint = eventType === "EARN"
        ? Number(customFee.fee_per_point_earned)
        : Number(customFee.fee_per_point_redeemed);
    }
  }

  const feeTotal = pointsAmount * feePerPoint;
  const periodMonth = new Date().toISOString().slice(0, 7);

  await supabase.from("ganha_ganha_billing_events").insert({
    brand_id: brandId,
    store_id: storeId,
    event_type: eventType,
    points_amount: pointsAmount,
    fee_per_point: feePerPoint,
    fee_total: feeTotal,
    reference_id: referenceId,
    reference_type: referenceType,
    period_month: periodMonth,
  });
}
