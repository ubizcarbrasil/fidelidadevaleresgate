import { supabase } from "@/integrations/supabase/client";
import type { DueloNotification } from "../types/tipos_notificacoes";

export async function listarNotificacoes(
  brandId: string,
  driverId: string,
  onlyUnread = false,
  limit = 20,
): Promise<DueloNotification[]> {
  const { data, error } = await supabase.rpc("driver_get_notifications", {
    p_brand_id: brandId,
    p_driver_id: driverId,
    p_only_unread: onlyUnread,
    p_limit: limit,
  });
  if (error) throw error;
  return ((data as unknown) as DueloNotification[]) ?? [];
}

export async function marcarNotificacaoLida(
  notificationId: string,
  driverId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("driver_mark_notification_read", {
    p_notification_id: notificationId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function marcarTodasComoLidas(
  brandId: string,
  driverId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("driver_mark_all_read", {
    p_brand_id: brandId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}