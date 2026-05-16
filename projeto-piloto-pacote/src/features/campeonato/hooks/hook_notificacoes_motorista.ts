import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasComoLidas,
} from "../services/servico_notificacoes_motorista";

const KEY = (brandId: string, driverId: string, onlyUnread: boolean) =>
  ["duelo-notificacoes", brandId, driverId, onlyUnread] as const;

export function useDriverNotifications(
  brandId: string | undefined,
  driverId: string | undefined,
  onlyUnread = false,
) {
  return useQuery({
    queryKey: KEY(brandId ?? "", driverId ?? "", onlyUnread),
    queryFn: () => listarNotificacoes(brandId!, driverId!, onlyUnread, 30),
    enabled: !!brandId && !!driverId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount(
  brandId: string | undefined,
  driverId: string | undefined,
) {
  const q = useDriverNotifications(brandId, driverId, true);
  return { count: q.data?.length ?? 0, isLoading: q.isLoading };
}

export function useMarkNotificationRead(
  brandId: string | undefined,
  driverId: string | undefined,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      marcarNotificacaoLida(notificationId, driverId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duelo-notificacoes", brandId ?? "", driverId ?? ""] });
    },
  });
}

export function useMarkAllNotificationsRead(
  brandId: string | undefined,
  driverId: string | undefined,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marcarTodasComoLidas(brandId!, driverId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duelo-notificacoes", brandId ?? "", driverId ?? ""] });
    },
  });
}