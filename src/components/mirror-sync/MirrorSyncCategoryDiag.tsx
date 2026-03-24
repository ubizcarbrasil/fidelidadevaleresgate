import { useQuery } from "@tanstack/react-query";
import { fetchMirroredDeals, fetchCategories } from "@/lib/api/mirrorSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";

const MIN_DEALS = 3;

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncCategoryDiag({ brandId, refreshKey }: Props) {
  const { data: categories = [] } = useQuery({
    queryKey: ["mirror-diag-cats", brandId, refreshKey],
    queryFn: () => fetchCategories(brandId),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["mirror-diag-deals", brandId, refreshKey],
    queryFn: () => fetchMirroredDeals(brandId),
  });

  const countByCategory = new Map<string, number>();
  const dealsByCategory = new Map<string, typeof deals>();

  for (const deal of deals) {
    const catId = deal.category_id ?? "none";
    countByCategory.set(catId, (countByCategory.get(catId) ?? 0) + 1);
    if (!dealsByCategory.has(catId)) dealsByCategory.set(catId, []);
    dealsByCategory.get(catId)!.push(deal);
  }

  const catRows = categories.map((cat) => {
    const count = countByCategory.get(cat.id) ?? 0;
    const viable = count >= MIN_DEALS;
    return { ...cat, count, viable };
  });

  const noCatCount = countByCategory.get("none") ?? 0;
  catRows.sort((a, b) => b.count - a.count);

  // Deals that overflow: belong to categories with < MIN_DEALS or have no category
  const overflowDeals: { title: string; categoryName: string; reason: string }[] = [];

  for (const row of catRows) {
    if (!row.viable && row.count > 0) {
      for (const d of dealsByCategory.get(row.id) ?? []) {
        overflowDeals.push({
          title: d.title,
          categoryName: row.name,
          reason: `Categoria "${row.name}" tem apenas ${row.count} deal(s) (mín: ${MIN_DEALS})`,
        });
      }
    }
  }

  for (const d of dealsByCategory.get("none") ?? []) {
    overflowDeals.push({
      title: d.title,
      categoryName: "Sem categoria",
      reason: "Deal sem categoria atribuída",
    });
  }

  const totalViable = catRows.filter((r) => r.viable).length;
  const totalOverflow = overflowDeals.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-primary">{totalViable}</div>
            <div className="text-[10px] text-muted-foreground">Categorias viáveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">{catRows.length}</div>
            <div className="text-[10px] text-muted-foreground">Total categorias</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className={`text-lg font-bold ${totalOverflow > 0 ? "text-orange-500" : ""}`}>{totalOverflow}</div>
            <div className="text-[10px] text-muted-foreground">Deals em overflow</div>
          </CardContent>
        </Card>
      </div>

      {/* Category table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center w-16">Deals</TableHead>
                <TableHead className="text-center w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-xs truncate">{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <span className="text-xs font-medium">{row.count}</span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    {row.viable ? (
                      <Badge variant="default" className="text-[10px] gap-1">
                        <CheckCircle className="h-3 w-3" /> Viável
                      </Badge>
                    ) : row.count > 0 ? (
                      <Badge variant="secondary" className="text-[10px] gap-1 text-orange-600">
                        <AlertTriangle className="h-3 w-3" /> Overflow
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Vazia</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {noCatCount > 0 && (
                <TableRow>
                  <TableCell className="py-2">
                    <span className="text-xs text-muted-foreground italic">Sem categoria</span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <span className="text-xs font-medium">{noCatCount}</span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <Badge variant="secondary" className="text-[10px] gap-1 text-orange-600">
                      <AlertTriangle className="h-3 w-3" /> Overflow
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overflow deals */}
      {overflowDeals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Deals em "Outras ofertas" ({overflowDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {overflowDeals.map((d, i) => (
                <div key={i} className="flex flex-col gap-0.5 text-xs border-b pb-1.5 last:border-0">
                  <span className="font-medium truncate">{d.title}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] px-1">{d.categoryName}</Badge>
                    <span className="truncate">{d.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
