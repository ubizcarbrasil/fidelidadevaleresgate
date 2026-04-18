import { useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, ChevronDown, Check, Home } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Rotas globais (sem escopo de marca/cidade). Switcher fica disabled aqui. */
const GLOBAL_ROUTES = [
  "/admin",
  "/users",
  "/audit",
  "/tema-plataforma",
  "/empresas",
  "/marcas",
  "/branches",
  "/clone-branch",
  "/dominios",
  "/api-keys",
  "/page-builder",
  "/welcome-tour",
  "/profile-links",
  "/partner-landing-config",
  "/galeria-icones",
  "/app-icons",
  "/central-banners",
  "/menu-labels",
  "/provisionar-marca",
  "/access-hub",
];

function isGlobalRoute(pathname: string): boolean {
  return GLOBAL_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

interface BrandRow { id: string; name: string; slug: string }
interface BranchRow { id: string; name: string; city: string | null }

export function ScopeSwitcher() {
  const { isRootAdmin } = useBrandGuard();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [brandOpen, setBrandOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentBrandId = searchParams.get("brandId");
  const currentBranchId = searchParams.get("branchId");
  const disabled = isGlobalRoute(location.pathname);

  const { data: brands = [] } = useQuery<BrandRow[]>({
    queryKey: ["brands-for-sidebar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      return (data as BrandRow[]) || [];
    },
    enabled: isRootAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const { data: branches = [] } = useQuery<BranchRow[]>({
    queryKey: ["branches-by-brand", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("branches")
        .select("id, name, city")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true)
        .order("name");
      return (data as BranchRow[]) || [];
    },
    enabled: isRootAdmin && !!currentBrandId,
    staleTime: 5 * 60 * 1000,
  });

  const currentBrand = useMemo(
    () => brands.find((b) => b.id === currentBrandId) || null,
    [brands, currentBrandId],
  );
  const currentBranch = useMemo(
    () => branches.find((b) => b.id === currentBranchId) || null,
    [branches, currentBranchId],
  );

  if (!isRootAdmin) return null;

  const brandLabel = currentBrand?.name ?? "Raiz";
  const branchLabel = currentBranch?.name ?? "Todas as cidades";
  const brandMissing = currentBrandId && !currentBrand && brands.length > 0;

  function selectBrand(brandId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (brandId) next.set("brandId", brandId);
    else next.delete("brandId");
    next.delete("branchId");
    const qs = next.toString();
    window.location.href = `${location.pathname}${qs ? `?${qs}` : ""}`;
  }

  function selectBranch(branchId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (branchId) next.set("branchId", branchId);
    else next.delete("branchId");
    const qs = next.toString();
    window.location.href = `${location.pathname}${qs ? `?${qs}` : ""}`;
  }

  // ── Brand picker ───────────────────────────────────────────
  const BrandPicker = (
    <Popover open={brandOpen} onOpenChange={setBrandOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 px-2 text-xs font-normal"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden lg:inline text-muted-foreground">Marca:</span>
          <span className={cn("max-w-[110px] truncate", brandMissing && "text-destructive")}>
            {brandMissing ? "Não encontrada" : brandLabel}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar marca…" className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma marca encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => { setBrandOpen(false); selectBrand(null); }}
                className="gap-2 text-xs"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="flex-1">Vale Resgate (Raiz)</span>
                {!currentBrandId && <Check className="h-3.5 w-3.5" />}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Marcas">
              {brands.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.name}
                  onSelect={() => { setBrandOpen(false); selectBrand(b.id); }}
                  className="gap-2 text-xs"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{b.name}</span>
                  {currentBrandId === b.id && <Check className="h-3.5 w-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // ── Branch picker ──────────────────────────────────────────
  const BranchPicker = currentBrandId ? (
    <Popover open={branchOpen} onOpenChange={setBranchOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !currentBrandId}
          className="h-8 gap-1.5 px-2 text-xs font-normal"
        >
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden lg:inline text-muted-foreground">Cidade:</span>
          <span className="max-w-[110px] truncate">{branchLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar cidade…" className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => { setBranchOpen(false); selectBranch(null); }}
                className="gap-2 text-xs"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="flex-1">Todas as cidades</span>
                {!currentBranchId && <Check className="h-3.5 w-3.5" />}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Cidades">
              {branches.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.name}
                  onSelect={() => { setBranchOpen(false); selectBranch(b.id); }}
                  className="gap-2 text-xs"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{b.name}</span>
                  {currentBranchId === b.id && <Check className="h-3.5 w-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  ) : null;

  // ── Mobile: Sheet com pickers empilhados ───────────────────
  const MobileTrigger = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-8 w-8 md:hidden"
          aria-label="Trocar escopo"
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="text-sm">Trocar escopo</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Marca</p>
            <Command className="border rounded-md">
              <CommandInput placeholder="Buscar marca…" className="h-9" />
              <CommandList className="max-h-[180px]">
                <CommandEmpty>Nenhuma marca.</CommandEmpty>
                <CommandItem
                  onSelect={() => { setSheetOpen(false); selectBrand(null); }}
                  className="gap-2 text-xs"
                >
                  <Home className="h-3.5 w-3.5" />
                  Vale Resgate (Raiz)
                  {!currentBrandId && <Check className="ml-auto h-3.5 w-3.5" />}
                </CommandItem>
                {brands.map((b) => (
                  <CommandItem
                    key={b.id}
                    value={b.name}
                    onSelect={() => { setSheetOpen(false); selectBrand(b.id); }}
                    className="gap-2 text-xs"
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{b.name}</span>
                    {currentBrandId === b.id && <Check className="ml-auto h-3.5 w-3.5" />}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
          {currentBrandId && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Cidade</p>
              <Command className="border rounded-md">
                <CommandInput placeholder="Buscar cidade…" className="h-9" />
                <CommandList className="max-h-[180px]">
                  <CommandEmpty>Nenhuma cidade.</CommandEmpty>
                  <CommandItem
                    onSelect={() => { setSheetOpen(false); selectBranch(null); }}
                    className="gap-2 text-xs"
                  >
                    <Home className="h-3.5 w-3.5" />
                    Todas as cidades
                    {!currentBranchId && <Check className="ml-auto h-3.5 w-3.5" />}
                  </CommandItem>
                  {branches.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={b.name}
                      onSelect={() => { setSheetOpen(false); selectBranch(b.id); }}
                      className="gap-2 text-xs"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{b.name}</span>
                      {currentBranchId === b.id && <Check className="ml-auto h-3.5 w-3.5" />}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  const desktopContent = (
    <div className="hidden md:flex items-center gap-1.5">
      {BrandPicker}
      {BranchPicker}
    </div>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {desktopContent}
              {MobileTrigger}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Esta tela é global e não usa escopo de marca.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center">
      {desktopContent}
      {MobileTrigger}
    </div>
  );
}
