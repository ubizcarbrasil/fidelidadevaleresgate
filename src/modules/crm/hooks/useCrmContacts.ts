/**
 * CRM Contacts hooks — ponte entre a camada de serviço e os componentes React.
 */
import { useQuery } from "@tanstack/react-query";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import * as contactService from "../services/contactService";
import type { CrmContactsQueryOptions } from "../types";

// Re-export types for consumers
export type { CrmContact, CrmEvent, ContactStats, EventStats } from "../types";

export function useCrmContacts(options: CrmContactsQueryOptions = {}) {
  const { currentBrandId } = useBrandGuard();
  const { source, gender, os_platform, search, page = 0 } = options;

  return useQuery({
    queryKey: ["crm-contacts", currentBrandId, source, gender, os_platform, search, page],
    queryFn: () => contactService.fetchContacts(currentBrandId!, options),
    enabled: !!currentBrandId,
    staleTime: 30_000, // 30s cache
  });
}

export function useCrmContactEvents(contactId: string | null) {
  return useQuery({
    queryKey: ["crm-contact-events", contactId],
    queryFn: () => contactService.fetchContactEvents(contactId!),
    enabled: !!contactId,
    staleTime: 15_000,
  });
}

export function useCrmContactStats() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-contact-stats", currentBrandId],
    queryFn: () => contactService.fetchContactStats(currentBrandId!),
    enabled: !!currentBrandId,
    staleTime: 60_000, // 1min cache — stats don't change often
  });
}

export function useCrmEventStats() {
  const { currentBrandId } = useBrandGuard();

  return useQuery({
    queryKey: ["crm-event-stats", currentBrandId],
    queryFn: () => contactService.fetchEventStats(currentBrandId!),
    enabled: !!currentBrandId,
    staleTime: 60_000,
  });
}
