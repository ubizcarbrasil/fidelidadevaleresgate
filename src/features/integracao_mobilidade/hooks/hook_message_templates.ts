import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type MessageTemplate = {
  id: string;
  brand_id: string;
  name: string;
  body_template: string;
  available_vars: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const QUERY_KEY = "driver-message-templates";

export function useMessageTemplates(brandId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_message_templates")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MessageTemplate[];
    },
    enabled: !!brandId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (template: Partial<MessageTemplate> & { brand_id: string }) => {
      if (template.id) {
        const { id, created_at, updated_at, ...rest } = template as any;
        const { error } = await (supabase as any)
          .from("driver_message_templates")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("driver_message_templates")
          .insert(template);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      toast({ title: "Template salvo com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar template", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await (supabase as any)
        .from("driver_message_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, brandId] });
      toast({ title: "Template removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover template", description: err.message, variant: "destructive" });
    },
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    upsertTemplate: upsertMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
