import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";

interface GroupRow { id: string; name: string; icon_name: string; order_index: number }
interface SubgroupRow { id: string; group_id: string; name: string; order_index: number }

export default function ManageGroupsDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newSubgroupName, setNewSubgroupName] = useState<Record<string, string>>({});

  const { data: groups } = useQuery({
    queryKey: queryKeys.permissionGroups.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_groups").select("*").order("order_index");
      if (error) throw error;
      return data as GroupRow[];
    },
    enabled: open,
  });

  const { data: subgroups } = useQuery({
    queryKey: queryKeys.permissionSubgroups.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_subgroups").select("*").order("order_index");
      if (error) throw error;
      return data as SubgroupRow[];
    },
    enabled: open,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.permissionGroups.all });
    qc.invalidateQueries({ queryKey: queryKeys.permissionSubgroups.all });
  };

  const addGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("permission_groups").insert({
        name: newGroupName,
        order_index: (groups?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); setNewGroupName(""); toast.success("Grupo criado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permission_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Grupo removido!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubgroup = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      const count = subgroups?.filter(s => s.group_id === groupId).length || 0;
      const { error } = await supabase.from("permission_subgroups").insert({
        group_id: groupId,
        name,
        order_index: count,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); setNewSubgroupName({}); toast.success("Subgrupo criado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSubgroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permission_subgroups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Subgrupo removido!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Gerenciar Grupos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Grupos & Subgrupos</DialogTitle>
        </DialogHeader>

        {/* Add group */}
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Nome do novo grupo..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Button size="sm" disabled={!newGroupName.trim()} onClick={() => addGroup.mutate()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Groups accordion */}
        <Accordion type="multiple" className="mt-4">
          {groups?.map((g) => {
            const subs = subgroups?.filter(s => s.group_id === g.id) || [];
            return (
              <AccordionItem key={g.id} value={g.id}>
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{g.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{subs.length} subgrupos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    {subs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">{s.name}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSubgroup.mutate(s.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Novo subgrupo..."
                        value={newSubgroupName[g.id] || ""}
                        onChange={(e) => setNewSubgroupName(prev => ({ ...prev, [g.id]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={!newSubgroupName[g.id]?.trim()}
                        onClick={() => addSubgroup.mutate({ groupId: g.id, name: newSubgroupName[g.id] })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs mt-1" onClick={() => removeGroup.mutate(g.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remover grupo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {(!groups || groups.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum grupo criado ainda.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
