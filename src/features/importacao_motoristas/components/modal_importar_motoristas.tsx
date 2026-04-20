import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import EtapaUpload from "./etapa_upload";
import EtapaPreview from "./etapa_preview";
import EtapaProgresso from "./etapa_progresso";
import EtapaResultado from "./etapa_resultado";
import { useImportarMotoristas } from "../hooks/hook_importar_motoristas";
import type { EtapaImportacao } from "../types/tipos_importacao";

interface Props {
  brandId: string;
  branchId?: string | null;
}

export default function ModalImportarMotoristas({ brandId, branchId }: Props) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<EtapaImportacao>("upload");
  const importer = useImportarMotoristas({ brandId, branchId });

  useEffect(() => {
    if (importer.erro) toast.error(importer.erro);
  }, [importer.erro]);

  const handleConfirmar = async () => {
    const id = await importer.iniciarImportacao();
    if (!id) return;
    setEtapa("progresso");
    const final = await importer.acompanharJob(id);
    setEtapa("resultado");
    if (final.status === "done") {
      const sucesso = final.created_count + final.updated_count;
      toast.success(`${sucesso} motorista(s) processados!`);
    }
  };

  const fechar = () => {
    setAberto(false);
    // limpa após animação fechar
    setTimeout(() => {
      importer.reset();
      setEtapa("upload");
    }, 300);
  };

  const novaImportacao = () => {
    importer.reset();
    setEtapa("upload");
  };

  const tituloPorEtapa: Record<EtapaImportacao, string> = {
    upload: "Importar motoristas",
    preview: "Conferir dados antes de importar",
    progresso: "Importando...",
    resultado: "Resultado",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Upload className="h-4 w-4 mr-1" />
        Importar planilha
      </Button>

      <Dialog open={aberto} onOpenChange={(open) => !open && etapa !== "progresso" && fechar()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tituloPorEtapa[etapa]}</DialogTitle>
            <DialogDescription>
              {etapa === "upload" && "Aceita CSV ou XLSX. Até 5.000 linhas por importação."}
              {etapa === "preview" && "Confira os dados detectados antes de enviar."}
              {etapa === "progresso" && "Não feche esta janela até a importação concluir."}
              {etapa === "resultado" && "Resumo do que foi importado."}
            </DialogDescription>
          </DialogHeader>

          {etapa === "upload" && (
            <EtapaUpload
              onLoaded={(linhas) => {
                importer.carregarPlanilha(linhas);
                setEtapa("preview");
              }}
            />
          )}

          {etapa === "preview" && (
            <EtapaPreview
              linhas={importer.linhasBrutas}
              resumo={importer.resumo}
              enviando={importer.enviando}
              onVoltar={() => {
                importer.reset();
                setEtapa("upload");
              }}
              onConfirmar={handleConfirmar}
            />
          )}

          {etapa === "progresso" && (
            <EtapaProgresso resultado={importer.resultado} totalLinhas={importer.linhasBrutas.length} />
          )}

          {etapa === "resultado" && importer.resultado && (
            <EtapaResultado resultado={importer.resultado} onNovaImportacao={novaImportacao} onFechar={fechar} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
