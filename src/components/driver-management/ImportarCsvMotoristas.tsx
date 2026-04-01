import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface Props {
  brandId: string;
}

interface LinhaCSV {
  cpf?: string;
  telefone?: string;
  nome?: string;
  email?: string;
  [key: string]: string | undefined;
}

interface ResultadoImport {
  linha: number;
  nome: string;
  status: "atualizado" | "criado" | "nao_encontrado" | "erro";
  mensagem?: string;
}

function parseCSV(text: string): LinhaCSV[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerRaw = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase());

  // Map common header variations
  const headerMap: Record<string, string> = {};
  headerRaw.forEach((h, i) => {
    const key = h
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "");
    if (key.includes("cpf")) headerMap[String(i)] = "cpf";
    else if (key.includes("telefone") || key.includes("phone") || key.includes("celular") || key.includes("tel"))
      headerMap[String(i)] = "telefone";
    else if (key.includes("email") || key.includes("e_mail")) headerMap[String(i)] = "email";
    else if (key.includes("nome") || key.includes("name")) headerMap[String(i)] = "nome";
    else headerMap[String(i)] = key;
  });

  return lines.slice(1).map((line) => {
    const cols = line.split(/[;,]/).map((c) => c.trim());
    const row: LinhaCSV = {};
    cols.forEach((val, i) => {
      const field = headerMap[String(i)];
      if (field && val) row[field] = val;
    });
    return row;
  });
}

function limparCpf(cpf: string | undefined): string | null {
  if (!cpf) return null;
  return cpf.replace(/\D/g, "").padStart(11, "0");
}

function limparTelefone(tel: string | undefined): string | null {
  if (!tel) return null;
  return tel.replace(/\D/g, "");
}

export default function ImportarCsvMotoristas({ brandId }: Props) {
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState<LinhaCSV[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoImport[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Selecione um arquivo .csv");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("Nenhuma linha válida encontrada no CSV.");
        return;
      }
      setLinhas(parsed);
      setResultados(null);
      setAberto(true);
    };
    reader.readAsText(file, "UTF-8");
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleImportar = async () => {
    setImportando(true);
    const results: ResultadoImport[] = [];

    // Load all drivers for this brand once
    const { data: drivers } = await (supabase as any)
      .from("customers")
      .select("id, name, cpf, phone, email")
      .eq("brand_id", brandId)
      .ilike("name", "%[MOTORISTA]%")
      .limit(1000);

    const allDrivers = drivers || [];

    // Get first branch for creating new drivers
    const { data: branches } = await supabase
      .from("branches")
      .select("id")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .limit(1);
    const defaultBranchId = branches?.[0]?.id;

    for (let i = 0; i < linhas.length; i++) {
      const row = linhas[i];
      const nomeCsv = row.nome || "—";
      const cpfLimpo = limparCpf(row.cpf);
      const telLimpo = limparTelefone(row.telefone);

      // Try to match: CPF → telefone → nome
      let matched = null as any;

      if (cpfLimpo && cpfLimpo.length >= 11) {
        matched = allDrivers.find(
          (d: any) => d.cpf && d.cpf.replace(/\D/g, "") === cpfLimpo
        );
      }

      if (!matched && telLimpo && telLimpo.length >= 10) {
        matched = allDrivers.find(
          (d: any) => d.phone && d.phone.replace(/\D/g, "") === telLimpo
        );
      }

      if (!matched && row.nome) {
        const nomeNorm = row.nome.toLowerCase().trim();
        matched = allDrivers.find((d: any) => {
          const driverName = (d.name || "")
            .replace(/\[MOTORISTA\]\s*/i, "")
            .toLowerCase()
            .trim();
          return driverName === nomeNorm;
        });
      }

      if (!matched) {
        // Fase 4: Criar novo motorista
        if (!defaultBranchId) {
          results.push({ linha: i + 2, nome: nomeCsv, status: "erro", mensagem: "Nenhuma filial encontrada" });
          continue;
        }
        if (!row.nome || !row.nome.trim()) {
          results.push({ linha: i + 2, nome: nomeCsv, status: "erro", mensagem: "Nome obrigatório para criar" });
          continue;
        }

        const newDriver: Record<string, any> = {
          name: `[MOTORISTA] ${row.nome.trim()}`,
          brand_id: brandId,
          branch_id: defaultBranchId,
          points_balance: 0,
          money_balance: 0,
        };
        if (cpfLimpo && cpfLimpo.length === 11) newDriver.cpf = cpfLimpo;
        if (row.telefone) newDriver.phone = row.telefone.trim();
        if (row.email) newDriver.email = row.email.trim();

        const { error } = await (supabase as any)
          .from("customers")
          .insert(newDriver);

        if (error) {
          results.push({ linha: i + 2, nome: nomeCsv, status: "erro", mensagem: error.message });
        } else {
          results.push({ linha: i + 2, nome: nomeCsv, status: "criado" });
        }
        continue;
      }

      // Build update payload — only update fields that have values in CSV
      const updatePayload: Record<string, string | null> = {};

      if (row.cpf) {
        const cpf = limparCpf(row.cpf);
        if (cpf && cpf.length === 11) updatePayload.cpf = cpf;
      }
      if (row.telefone) {
        updatePayload.phone = row.telefone.trim();
      }
      if (row.email) {
        updatePayload.email = row.email.trim();
      }
      if (row.nome) {
        updatePayload.name = `[MOTORISTA] ${row.nome.trim()}`;
      }

      if (Object.keys(updatePayload).length === 0) {
        results.push({ linha: i + 2, nome: nomeCsv, status: "nao_encontrado", mensagem: "Sem dados para atualizar" });
        continue;
      }

      const { error } = await (supabase as any)
        .from("customers")
        .update(updatePayload)
        .eq("id", matched.id);

      if (error) {
        results.push({ linha: i + 2, nome: nomeCsv, status: "erro", mensagem: error.message });
      } else {
        results.push({ linha: i + 2, nome: nomeCsv, status: "atualizado" });
      }
    }

    setResultados(results);
    setImportando(false);

    const atualizados = results.filter((r) => r.status === "atualizado").length;
    const criados = results.filter((r) => r.status === "criado").length;
    if (atualizados > 0 || criados > 0) {
      queryClient.invalidateQueries({ queryKey: ["driver-management"] });
      const msgs: string[] = [];
      if (atualizados > 0) msgs.push(`${atualizados} atualizado(s)`);
      if (criados > 0) msgs.push(`${criados} criado(s)`);
      toast.success(`Motoristas: ${msgs.join(", ")}!`);
    }
  };

  const fechar = () => {
    setAberto(false);
    setLinhas([]);
    setResultados(null);
  };

  const atualizados = resultados?.filter((r) => r.status === "atualizado").length ?? 0;
  const naoEncontrados = resultados?.filter((r) => r.status === "nao_encontrado").length ?? 0;
  const erros = resultados?.filter((r) => r.status === "erro").length ?? 0;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-1" />
        Importar CSV
      </Button>

      <Dialog open={aberto} onOpenChange={(open) => !open && fechar()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Dados de Motoristas
            </DialogTitle>
            <DialogDescription>
              {!resultados
                ? `${linhas.length} linha(s) encontrada(s). O match será feito por CPF → Telefone → Nome.`
                : "Resultado da importação:"}
            </DialogDescription>
          </DialogHeader>

          {!resultados ? (
            <>
              <ScrollArea className="max-h-60 rounded-md border p-3">
                <div className="space-y-1.5 text-sm">
                  {linhas.slice(0, 20).map((row, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs w-6 text-right shrink-0">{i + 2}</span>
                      <span className="font-medium text-foreground truncate">{row.nome || "—"}</span>
                      {row.cpf && <Badge variant="outline" className="text-[10px]">CPF</Badge>}
                      {row.telefone && <Badge variant="outline" className="text-[10px]">Tel</Badge>}
                      {row.email && <Badge variant="outline" className="text-[10px]">Email</Badge>}
                    </div>
                  ))}
                  {linhas.length > 20 && (
                    <p className="text-xs text-muted-foreground pt-1">...e mais {linhas.length - 20} linhas</p>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={fechar}>Cancelar</Button>
                <Button onClick={handleImportar} disabled={importando}>
                  {importando ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Importando...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-1" />Importar {linhas.length} linhas</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex gap-3 text-sm">
                <Badge className="bg-green-500/10 text-green-400 border-green-400/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{atualizados} atualizados
                </Badge>
                {naoEncontrados > 0 && (
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-400/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />{naoEncontrados} não encontrados
                  </Badge>
                )}
                {erros > 0 && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-400/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />{erros} erros
                  </Badge>
                )}
              </div>

              <ScrollArea className="max-h-60 rounded-md border p-3">
                <div className="space-y-1.5 text-sm">
                  {resultados.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {r.status === "atualizado" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      )}
                      <span className="text-xs w-6 text-right text-muted-foreground shrink-0">L{r.linha}</span>
                      <span className="truncate">{r.nome}</span>
                      {r.mensagem && <span className="text-xs text-muted-foreground truncate">— {r.mensagem}</span>}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button onClick={fechar}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
