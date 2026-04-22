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
import { ImportacaoTimeoutError, ImportacaoUploadError, type EtapaImportacao } from "../types/tipos_importacao";

interface Props {
  brandId: string;
  branchId?: string | null;
  /** Permite abrir o modal externamente já apontando para um job em andamento. */
  jobIdParaAcompanhar?: string | null;
  abertoExterno?: boolean;
  onAbertoChange?: (aberto: boolean) => void;
}

export default function ModalImportarMotoristas({
  brandId,
  branchId,
  jobIdParaAcompanhar,
  abertoExterno,
  onAbertoChange,
}: Props) {
  const [abertoInterno, setAbertoInterno] = useState(false);
  const aberto = abertoExterno ?? abertoInterno;
  const setAberto = (v: boolean) => {
    if (onAbertoChange) onAbertoChange(v);
    else setAbertoInterno(v);
  };
  const [etapa, setEtapa] = useState<EtapaImportacao>("upload");
  const importer = useImportarMotoristas({ brandId, branchId });

  useEffect(() => {
    if (importer.erro) toast.error(importer.erro);
  }, [importer.erro]);

  /** Acompanha um job já existente (id), tratando timeout amigável. */
  const acompanharComTratamento = async (id: string) => {
    try {
      const final = await importer.acompanharJob(id);
      setEtapa("resultado");
      if (final.status === "done") {
        const sucesso = final.created_count + final.updated_count;
        toast.success(`${sucesso} motorista(s) processados!`);
      }
    } catch (err) {
      if (err instanceof ImportacaoTimeoutError) {
        toast.error(
          "Sem resposta do servidor. A importação pode estar continuando — toque em 'Atualizar status' ou recarregue a página.",
          { duration: 8000 }
        );
        // Não fecha modal — usuário pode atualizar manualmente.
      } else {
        toast.error("Erro ao acompanhar importação.");
        setEtapa("resultado");
      }
    }
  };

  const handleConfirmar = async () => {
    const id = await importer.iniciarImportacao();
    if (!id) {
      // Erro já foi setado em importer.erro e exibido via toast pelo useEffect.
      // Mantém na etapa preview pra usuário tentar novamente sem perder os dados.
      return;
    }
    setEtapa("progresso");
    await acompanharComTratamento(id);
  };

  /** Consulta manual ao servidor (botão "Atualizar status"). */
  const handleAtualizarStatus = async () => {
    const id = importer.jobId ?? jobIdParaAcompanhar ?? null;
    if (!id) return;
    const r = await importer.consultarJob(id);
    if (!r) {
      toast.error("Não foi possível consultar o status agora.");
      return;
    }
    if (r.status === "done" || r.status === "error") {
      setEtapa("resultado");
      if (r.status === "done") {
        const sucesso = r.created_count + r.updated_count;
        toast.success(`${sucesso} motorista(s) processados!`);
      }
    } else {
      toast.message(`Em andamento: ${r.processed_rows} de ${r.total_rows} linhas`);
    }
  };

  const handleSegundoPlano = () => {
    toast.message("Importação continua em segundo plano.", {
      description: "Toque em 'Importar planilha' depois para acompanhar.",
      duration: 6000,
    });
    setAberto(false);
  };

  // Quando recebido um jobId externo, anexa e começa a acompanhar.
  useEffect(() => {
    if (aberto && jobIdParaAcompanhar && !importer.jobId) {
      importer.anexarJobExistente(jobIdParaAcompanhar);
      setEtapa("progresso");
      void acompanharComTratamento(jobIdParaAcompanhar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, jobIdParaAcompanhar]);

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
      {/* Quando o componente é controlado externamente, não renderiza o botão. */}
      {abertoExterno === undefined && (
        <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Importar planilha
        </Button>
      )}

      <Dialog open={aberto} onOpenChange={(open) => !open && etapa !== "progresso" && fechar()}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base sm:text-lg pr-6">{tituloPorEtapa[etapa]}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
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
            <EtapaProgresso
              resultado={importer.resultado}
              totalLinhas={importer.linhasBrutas.length}
              jobId={importer.jobId}
              onAtualizar={handleAtualizarStatus}
              onContinuarSegundoPlano={handleSegundoPlano}
            />
          )}

          {etapa === "resultado" && importer.resultado && (
            <EtapaResultado resultado={importer.resultado} onNovaImportacao={novaImportacao} onFechar={fechar} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
