import { useState, useCallback } from "react";
import { useDebounce } from "./useDebounce";

/**
 * Encapsulates the debounced search + pagination pattern used across CRUD pages.
 * Replaces manual useState+useEffect+setTimeout in OffersPage, StoresPage, CustomersPage, RedemptionsPage.
 */
export function useDebouncedSearch(delay = 300) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, delay);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return { search, debouncedSearch, page, setPage, onSearchChange };
}
