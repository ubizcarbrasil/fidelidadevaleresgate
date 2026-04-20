/**
 * Página /admin/auditoria-duplicacoes
 *
 * Relatório consolidado de itens de menu que aparecem em mais de um lugar
 * nos consoles Root, Empreendedor (Brand) e Cidade (Branch).
 *
 * Acesso restrito a Root Admin (via RootGuard no App.tsx).
 * Esta página é READ-ONLY — não remove, esconde ou renomeia nada.
 */
import { AlertTriangle, MapPin, Building2, Globe2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useDuplicacoesMenu } from "@/compartilhados/hooks/hook_duplicacoes_menu";
import type { ConsoleSidebar } from "@/compartilhados/utils/utilitarios_duplicacao_menu";

const CONSOLE_LABEL: Record<ConsoleSidebar, string> = {
  ROOT: "Root",
  BRAND: "Empreendedor",
  BRANCH: "Cidade",
};

const CONSOLE_ICON: Record<ConsoleSidebar, typeof Globe2> = {
  ROOT: Globe2,
  BRAND: Building2,
  BRANCH: MapPin,
};

export default function PaginaAuditoriaDuplicacoes() {
  const { relatorios, ocorrencias } = useDuplicacoesMenu();

  const intraConsole = relatorios.filter((r) => r.escopo === "intra_console");
  const entreConsoles = relatorios.filter((r) => r.escopo === "entre_consoles");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-2.5 shrink-0">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Auditoria de Duplicações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Itens que aparecem em mais de um menu nos consoles Root, Empreendedor e Cidade.
            Use este relatório para decidir, item por item, se vale unificar ou manter.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex gap-3 items-start">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Esta tela é <strong>somente leitura</strong>. Nada é removido automaticamente.
            O selo <Badge variant="outline" className="mx-1 border-warning/40 text-warning text-[10px] py-0">⚠ DUP</Badge>
            só aparece no sidebar quando o item está duplicado <strong>dentro do mesmo painel</strong>.
            Itens compartilhados entre painéis diferentes (Root, Empreendedor, Cidade) são esperados pela arquitetura SaaS.
          </p>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Total de Itens</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{ocorrencias.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">No Mesmo Painel</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{intraConsole.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Requer revisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Entre Painéis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{entreConsoles.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Geralmente esperado</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {relatorios.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            🎉 Nenhuma duplicação detectada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* ─── INTRA CONSOLE ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">🔴 Duplicações no mesmo painel</h2>
              <Badge variant="destructive" className="text-[10px]">{intraConsole.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              O mesmo item aparece em mais de um lugar dentro do mesmo console — alta prioridade para revisão.
            </p>
            {intraConsole.length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Nenhuma duplicação interna detectada.</CardContent></Card>
            ) : (
              <div className="space-y-4">{intraConsole.map((rel) => <CardRelatorio key={rel.id} rel={rel} />)}</div>
            )}
          </section>

          {/* ─── ENTRE CONSOLES ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">ℹ️ Mesma rota em painéis diferentes</h2>
              <Badge variant="outline" className="text-[10px]">{entreConsoles.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Itens compartilhados entre Root, Empreendedor e Cidade — geralmente esperado pela arquitetura SaaS hierárquica.
              Não são marcados no sidebar.
            </p>
            {entreConsoles.length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Nenhum compartilhamento entre painéis detectado.</CardContent></Card>
            ) : (
              <div className="space-y-4">{entreConsoles.map((rel) => <CardRelatorio key={rel.id} rel={rel} />)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CardRelatorio({ rel }: { rel: ReturnType<typeof useDuplicacoesMenu>["relatorios"][number] }) {
  return (
            <Card key={rel.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {rel.severidade === "rota_exata" ? (
                        <Badge variant="destructive" className="text-[10px]">Rota duplicada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">Mesma função</Badge>
                      )}
                      <span className="font-mono text-sm">{rel.criterio}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aparece em {rel.ocorrencias.length} pontos diferentes
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Console</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Rota</TableHead>
                      <TableHead className="hidden md:table-cell">Módulo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rel.ocorrencias.map((o, idx) => {
                      const Icon = CONSOLE_ICON[o.console];
                      return (
                        <TableRow key={`${o.console}-${o.grupo}-${o.itemKey}-${idx}`}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">{CONSOLE_LABEL[o.console]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{o.grupo}</TableCell>
                          <TableCell className="text-xs font-medium">{o.defaultTitle}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">{o.url}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">{o.moduleKey ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
  );
}