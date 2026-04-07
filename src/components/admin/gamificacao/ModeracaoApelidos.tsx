import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  branchId: string;
}

export default function ModeracaoApelidos({ branchId }: Props) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: participantes, isLoading } = useQuery({
    queryKey: ["admin-moderacao-apelidos", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_duel_participants")
        .select("id, customer_id, public_nickname, avatar_url, duels_enabled, customer:customers!driver_duel_participants_customer_id_fkey(name)")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const salvarApelido = useMutation({
    mutationFn: async ({ id, nickname }: { id: string; nickname: string }) => {
      const { error } = await supabase
        .from("driver_duel_participants")
        .update({ public_nickname: nickname || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Apelido atualizado!");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin-moderacao-apelidos", branchId] });
    },
    onError: () => toast.error("Erro ao atualizar apelido"),
  });

  const startEdit = (id: string, current: string | null) => {
    setEditingId(id);
    setEditValue(current || "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Moderação de Apelidos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !participantes?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum participante encontrado.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Real</TableHead>
                    <TableHead>Apelido Público</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantes.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{(p.customer as any)?.name || "—"}</TableCell>
                      <TableCell>
                        {editingId === p.id ? (
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={e => e.key === "Enter" && salvarApelido.mutate({ id: p.id, nickname: editValue })}
                          />
                        ) : (
                          <span className="text-sm">{p.public_nickname || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.duels_enabled ? "default" : "secondary"}>
                          {p.duels_enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingId === p.id ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => salvarApelido.mutate({ id: p.id, nickname: editValue })}>
                              <Check className="h-3.5 w-3.5 text-green-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(p.id, p.public_nickname)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {participantes.map((p: any) => (
                <div key={p.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1 min-w-0">{(p.customer as any)?.name || "—"}</p>
                    <Badge variant={p.duels_enabled ? "default" : "secondary"} className="shrink-0 text-xs">
                      {p.duels_enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === p.id ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="h-8 text-sm flex-1"
                          autoFocus
                          placeholder="Apelido..."
                          onKeyDown={e => e.key === "Enter" && salvarApelido.mutate({ id: p.id, nickname: editValue })}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => salvarApelido.mutate({ id: p.id, nickname: editValue })}>
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground flex-1 truncate">{p.public_nickname || "Sem apelido"}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => startEdit(p.id, p.public_nickname)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
