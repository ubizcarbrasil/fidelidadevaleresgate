import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCriarPacote } from "../hooks/hook_pacotes_pontos";

export function DialogoCriarPacote() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [pontos, setPontos] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const criarPacote = useCriarPacote();

  const handleSubmit = () => {
    const pontosNum = parseInt(pontos);
    const precoNum = Math.round(parseFloat(preco.replace(",", ".")) * 100);
    if (!nome || isNaN(pontosNum) || isNaN(precoNum) || pontosNum <= 0 || precoNum <= 0) return;

    criarPacote.mutate(
      { name: nome, points_amount: pontosNum, price_cents: precoNum, description: descricao || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setNome(""); setPontos(""); setPreco(""); setDescricao("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Pacote</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Pacote de Pontos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Nome do Pacote</Label>
            <Input placeholder="Ex: Pacote Básico" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade de Pontos</Label>
              <Input type="number" placeholder="5000" value={pontos} onChange={(e) => setPontos(e.target.value)} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input placeholder="50,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea placeholder="Descrição do pacote..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={criarPacote.isPending} className="w-full">
            {criarPacote.isPending ? "Criando..." : "Criar Pacote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
