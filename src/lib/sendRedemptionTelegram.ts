import { supabase } from "@/integrations/supabase/client";

interface RedemptionTelegramPayload {
  brandId: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  customerCpf?: string;
  productTitle: string;
  pointsSpent: number;
  deliveryAddress: string;
  productUrl?: string;
  orderSource: "customer" | "driver";
}

export async function sendRedemptionTelegramNotification(payload: RedemptionTelegramPayload) {
  try {
    // Find telegram_chat_id from machine_integrations
    const { data: integrations } = await supabase
      .from("machine_integrations")
      .select("telegram_chat_id")
      .eq("brand_id", payload.brandId)
      .not("telegram_chat_id", "is", null)
      .limit(1);

    const chatId = integrations?.[0]?.telegram_chat_id;
    if (!chatId) return; // No Telegram configured

    await supabase.functions.invoke("send-telegram-ride-notification", {
      body: {
        chat_id: chatId,
        is_redemption_notification: true,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_cpf: payload.customerCpf,
        product_title: payload.productTitle,
        points_spent: payload.pointsSpent,
        delivery_address: payload.deliveryAddress,
        product_url: payload.productUrl,
        order_source: payload.orderSource,
      },
    });
  } catch {
    // Silent — don't block checkout for Telegram failure
  }
}
