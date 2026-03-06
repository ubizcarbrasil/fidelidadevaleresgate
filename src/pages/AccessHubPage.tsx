import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ExternalLink, Store, Users, Search, Building2, Smartphone } from "lucide-react";

/* ─── ROOT: brands list ─── */
function RootBrandsTab() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("brands")
      .select("id, name, slug, is_active, subscription_status")
      .order("name")
      .then(({ data }) => {
        setBrands(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{brand.slug}</TableCell>
                <TableCell>
                  <Badge variant={brand.is_active ? "default" : "secondary"}>
                    {brand.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      window.open(`/?brandId=${brand.id}`, "_blank")
                    }
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Painel Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      window.open(`/customer-preview?brandId=${brand.id}`, "_blank")
                    }
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    App do Cliente
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma marca encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ─── BRAND: stores list ─── */
function BrandStoresTab({ brandId }: { brandId: string }) {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("stores")
      .select("id, name, address, approval_status, store_type")
      .eq("brand_id", brandId)
      .order("name")
      .then(({ data }) => {
        setStores(data || []);
        setLoading(false);
      });
  }, [brandId]);

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar parceiro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parceiro</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {store.address || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      store.approval_status === "APPROVED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {store.approval_status === "APPROVED"
                      ? "Aprovado"
                      : store.approval_status === "PENDING"
                      ? "Pendente"
                      : store.approval_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      window.open(`/store-panel?storeId=${store.id}`, "_blank")
                    }
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver Painel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum parceiro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ─── BRAND: customer app link ─── */
function BrandCustomerPreviewTab({ brandId }: { brandId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Smartphone className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-lg">App do Cliente</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Visualize o aplicativo do cliente exatamente como seus consumidores veem, com o tema e conteúdo da sua marca.
        </p>
      </div>
      <Button
        className="gap-2"
        onClick={() =>
          window.open(`/customer-preview?brandId=${brandId}`, "_blank")
        }
      >
        <ExternalLink className="h-4 w-4" />
        Abrir App do Cliente
      </Button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ─── Main page ─── */
export default function AccessHubPage() {
  const { isRootAdmin } = useAuth();
  const { currentBrandId } = useBrandGuard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Acessos"
        description="Acesse os painéis individuais de cada entidade"
      />

      {isRootAdmin ? (
        <RootBrandsTab />
      ) : currentBrandId ? (
        <Tabs defaultValue="parceiros" className="space-y-4">
          <TabsList>
            <TabsTrigger value="parceiros" className="gap-1.5">
              <Store className="h-4 w-4" />
              Parceiros
            </TabsTrigger>
            <TabsTrigger value="cliente" className="gap-1.5">
              <Smartphone className="h-4 w-4" />
              App do Cliente
            </TabsTrigger>
          </TabsList>
          <TabsContent value="parceiros">
            <BrandStoresTab brandId={currentBrandId} />
          </TabsContent>
          <TabsContent value="cliente">
            <BrandCustomerPreviewTab brandId={currentBrandId} />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-muted-foreground">
          Nenhuma marca vinculada encontrada.
        </p>
      )}
    </div>
  );
}
