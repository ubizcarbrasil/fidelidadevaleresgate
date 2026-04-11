import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface AdminNotification {
  id: string;
  brand_id: string;
  title: string;
  body: string | null;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useAdminNotifications() {
  const { currentBrandId } = useBrandGuard();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentBrandId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("brand_id", currentBrandId)
      .order("created_at", { ascending: false })
      .limit(50);

    const items = (data || []) as AdminNotification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [currentBrandId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!currentBrandId) return;

    const channel = supabase
      .channel(`admin-notif-${currentBrandId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
          filter: `brand_id=eq.${currentBrandId}`,
        },
        (payload) => {
          const newNotif = payload.new as AdminNotification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBrandId]);

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase
        .from("admin_notifications")
        .update({ is_read: true } as any)
        .eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentBrandId) return;
    await supabase
      .from("admin_notifications")
      .update({ is_read: true } as any)
      .eq("brand_id", currentBrandId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [currentBrandId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
