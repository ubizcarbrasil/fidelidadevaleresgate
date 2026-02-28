import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { icons, type LucideProps } from "lucide-react";
import { Search } from "lucide-react";

interface IconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (icon: { type: "lucide"; name: string } | { type: "custom"; url: string; name: string }) => void;
  brandId?: string;
}

const LUCIDE_ICON_NAMES = Object.keys(icons).slice(0, 500); // limit for perf

export default function IconPickerDialog({ open, onClose, onSelect, brandId }: IconPickerDialogProps) {
  const [search, setSearch] = useState("");

  const { data: customIcons } = useQuery({
    queryKey: ["icon-library", brandId],
    queryFn: async () => {
      let q = supabase.from("icon_library").select("*").eq("is_active", true);
      if (brandId) q = q.or(`brand_id.eq.${brandId},brand_id.is.null`);
      else q = q.is("brand_id", null);
      const { data } = await q;
      return data || [];
    },
    enabled: open,
  });

  const filteredLucide = useMemo(() => {
    if (!search) return LUCIDE_ICON_NAMES.slice(0, 100);
    return LUCIDE_ICON_NAMES.filter((n) =>
      n.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100);
  }, [search]);

  const filteredCustom = useMemo(() => {
    if (!customIcons) return [];
    if (!search) return customIcons;
    return customIcons.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [customIcons, search]);

  const renderLucideIcon = (name: string) => {
    const Icon = icons[name as keyof typeof icons];
    if (!Icon) return null;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ícone..."
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="lucide">
          <TabsList className="w-full">
            <TabsTrigger value="lucide" className="flex-1">Nativos</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="lucide">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-6 gap-1 p-1">
                {filteredLucide.map((name) => (
                  <Button
                    key={name}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    title={name}
                    onClick={() => {
                      onSelect({ type: "lucide", name });
                      onClose();
                    }}
                  >
                    {renderLucideIcon(name)}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom">
            <ScrollArea className="h-[300px]">
              {filteredCustom.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum ícone personalizado cadastrado.
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-1 p-1">
                  {filteredCustom.map((icon) => (
                    <Button
                      key={icon.id}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      title={icon.name}
                      onClick={() => {
                        if (icon.icon_type === "lucide" && icon.lucide_name) {
                          onSelect({ type: "lucide", name: icon.lucide_name });
                        } else if (icon.image_url) {
                          onSelect({ type: "custom", url: icon.image_url, name: icon.name });
                        }
                        onClose();
                      }}
                    >
                      {icon.icon_type === "lucide" && icon.lucide_name
                        ? renderLucideIcon(icon.lucide_name)
                        : icon.image_url
                        ? <img src={icon.image_url} alt={icon.name} className="h-5 w-5 object-contain" />
                        : null}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
