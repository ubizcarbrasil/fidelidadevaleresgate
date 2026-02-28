import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";

export interface CustomerNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

export function useCustomerNotifications() {
  const { customer } = useCustomer();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!customer) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("customer_notifications")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const items = (data || []) as CustomerNotification[];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [customer]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!customer) return;

    const channel = supabase
      .channel(`notifications-${customer.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "customer_notifications",
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          const newNotif = payload.new as CustomerNotification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!customer) return;
      await supabase
        .from("customer_notifications")
        .update({ is_read: true })
        .eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [customer]
  );

  const markAllAsRead = useCallback(async () => {
    if (!customer) return;
    await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("customer_id", customer.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [customer]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
