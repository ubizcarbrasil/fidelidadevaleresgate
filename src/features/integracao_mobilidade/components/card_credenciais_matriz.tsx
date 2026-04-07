import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import {
  KeyRound, Eye, EyeOff, Save, Check, Loader2, CheckCircle, ChevronDown,
} from "lucide-react";
import type { BrandMatrix } from "../hooks/hook_integracoes";

interface Props {
  brandId: string;
  brandMatrix: BrandMatrix;
}

export function CardCredenciaisMatriz({ brandId, brandMatrix }: Props) {
  const queryClient = useQueryClient();

  const [matrixApiKey, setMatrixApiKey] = useState("");
  const [showMatrixApiKey, setShowMatrixApiKey] = useState(false);
  const [matrixBasicUser, setMatrixBasicUser] = useState("");
  const [matrixBasicPass, setMatrixBasicPass] = useState("");
  const [showMatrixPass, setShowMatrixPass] = useState(false);
  const [matrixSaved, setMatrixSaved] = useState(false);

  const isConfigured = Boolean(brandMatrix?.matrix_api_key);
  const [open, setOpen] = useState(!isConfigured);

  useEffect(() => {
    if (brandMatrix) {
      setMatrixApiKey(brandMatrix.matrix_api_key || "");
      setMatrixBasicUser(brandMatrix.matrix_basic_auth_user || "");
      setMatrixBasicPass(brandMatrix.matrix_basic_auth_password || "");
      setOpen(!brandMatrix.matrix_api_key);
    }
  }, [brandMatrix]);

  const saveMatrixMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("brands")
        .update({
          matrix_api_key: matrixApiKey || null,
          matrix_basic_auth_user: matrixBasicUser || null,
          matrix_basic_auth_password: matrixBasicPass || null,
        })
        .eq("id", brandId);
      if (error) throw error;
    },
    onSuccess: () => {
      setMatrixSaved(true);
      setTimeout(() => setMatrixSaved(false), 2000);
      toast({ title: "Credenciais da matriz salvas!" });
      queryClient.invalidateQueries({ queryKey: ["brand-matrix", brandId] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-primary" />
                Credenciais da Matriz (Sede)
                {isConfigured && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" /> Configurado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configuração única para todas as cidades. Usada para buscar recibos e identificar passageiros.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Chave API da Matriz</Label>
              <div className="relative">
                <Input
                  type={showMatrixApiKey ? "text" : "password"}
                  value={matrixApiKey}
                  onChange={(e) => setMatrixApiKey(e.target.value)}
                  placeholder="api-key da matriz"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowMatrixApiKey(!showMatrixApiKey); }}>
                  {showMatrixApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usuário Basic Auth da Matriz</Label>
              <Input value={matrixBasicUser} onChange={(e) => setMatrixBasicUser(e.target.value)} placeholder="Usuário de autenticação da matriz" />
            </div>
            <div className="space-y-2">
              <Label>Senha Basic Auth da Matriz</Label>
              <div className="relative">
                <Input type={showMatrixPass ? "text" : "password"} value={matrixBasicPass} onChange={(e) => setMatrixBasicPass(e.target.value)} placeholder="Senha de autenticação da matriz" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowMatrixPass(!showMatrixPass); }}>
                  {showMatrixPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => saveMatrixMutation.mutate()} disabled={saveMatrixMutation.isPending}>
                {matrixSaved ? <Check className="h-4 w-4 text-primary mr-1" /> : saveMatrixMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar credenciais da Matriz
              </Button>
            </div>
            {isConfigured && (
              <Alert className="border-primary/30 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  Matriz configurada. Todas as cidades usarão estas credenciais para buscar recibos e pontuar passageiros.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
