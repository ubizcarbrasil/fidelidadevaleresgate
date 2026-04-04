import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, MapPin, Palette, Tag, Gift, Store, Users, BarChart3, Settings, Shield, Megaphone, Star, CreditCard, FileText, Key, BookOpen, Coins, Receipt, ShoppingBag, User, Ticket, Layers, Globe, Zap, Heart } from "lucide-react";

/* ── Static page entries ── */
const pages = [
  { label: "Visão Geral", path: "/", icon: LayoutDashboard },
  { label: "Cidades", path: "/branches", icon: MapPin },
  { label: "Aparência", path: "/brands", icon: Palette },
  { label: "Ofertas", path: "/offers", icon: Tag },
  { label: "Resgates", path: "/redemptions", icon: Gift },
  { label: "Cupons", path: "/vouchers", icon: Ticket },
  { label: "Parceiros", path: "/stores", icon: Store },
  { label: "Clientes", path: "/customers", icon: Users },
  { label: "Relatórios", path: "/reports", icon: BarChart3 },
  { label: "CRM", path: "/crm", icon: Megaphone },
  { label: "Usuários", path: "/users", icon: Shield },
  { label: "Auditoria", path: "/audit", icon: FileText },
  { label: "Configurações", path: "/brand-settings", icon: Settings },
  { label: "Módulos", path: "/brand-modules", icon: Layers },
  { label: "Regras de Fidelidade", path: "/points-rules", icon: Star },
  { label: "Pontuar", path: "/earn-points", icon: Coins },
  { label: "Extrato", path: "/points-ledger", icon: Receipt },
  { label: "APIs", path: "/api-keys", icon: Key },
  { label: "Documentação API", path: "/api-docs", icon: BookOpen },
  { label: "Banners", path: "/banners", icon: Globe },
  { label: "Assinatura", path: "/subscription", icon: CreditCard },
  { label: "Catálogo", path: "/store-catalog", icon: ShoppingBag },
  { label: "Notificações", path: "/send-notification", icon: Zap },
  { label: "Favoritos / Achadinhos", path: "/affiliate-deals", icon: Heart },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);

  /* ── Keyboard shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Supabase queries (only when ≥2 chars) ── */
  const shouldQuery = debouncedSearch.length >= 2;

  const [offers, setOffers] = useState<{ id: string; title: string; store_name?: string }[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string; segment?: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldQuery) {
      setOffers([]);
      setStores([]);
      setCustomers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const pattern = `%${debouncedSearch}%`;

    Promise.all([
      supabase
        .from("offers")
        .select("id, title")
        .ilike("title", pattern)
        .limit(5),
      supabase
        .from("stores")
        .select("id, name, segment")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("customers")
        .select("id, name, email")
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(5),
    ]).then(([offersRes, storesRes, customersRes]) => {
      if (cancelled) return;
      setOffers((offersRes.data as any[]) || []);
      setStores((storesRes.data as any[]) || []);
      setCustomers((customersRes.data as any[]) || []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedSearch, shouldQuery]);

  const select = useCallback(
    (path: string) => {
      setOpen(false);
      setSearch("");
      navigate(path);
    },
    [navigate],
  );

  const hasResults = offers.length > 0 || stores.length > 0 || customers.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar páginas, ofertas, parceiros, clientes…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Buscando…" : "Nenhum resultado encontrado."}
        </CommandEmpty>

        {/* Pages — always shown, filtered client-side by cmdk */}
        <CommandGroup heading="Páginas">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => select(p.path)} className="gap-2">
              <p.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Data results — only when querying */}
        {shouldQuery && hasResults && <CommandSeparator />}

        {offers.length > 0 && (
          <CommandGroup heading="Ofertas">
            {offers.map((o) => (
              <CommandItem key={o.id} value={`offer-${o.title}`} onSelect={() => select(`/offers`)} className="gap-2">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{o.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {stores.length > 0 && (
          <CommandGroup heading="Parceiros">
            {stores.map((s) => (
              <CommandItem key={s.id} value={`store-${s.name}`} onSelect={() => select(`/stores`)} className="gap-2">
                <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{s.name}</span>
                {s.segment && <span className="ml-auto text-[10px] text-muted-foreground">{s.segment}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {customers.length > 0 && (
          <CommandGroup heading="Clientes">
            {customers.map((c) => (
              <CommandItem key={c.id} value={`customer-${c.name}-${c.email}`} onSelect={() => select(`/customers`)} className="gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{c.name}</span>
                {c.email && <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[140px]">{c.email}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
