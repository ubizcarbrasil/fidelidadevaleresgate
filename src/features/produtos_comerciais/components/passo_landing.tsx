import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, ListChecks, MessageSquareQuote, HelpCircle } from "lucide-react";
import PassoLandingVisual from "./passo_landing_visual";
import PassoLandingBeneficios from "./passo_landing_beneficios";
import PassoLandingProvas from "./passo_landing_provas";
import PassoLandingFaq from "./passo_landing_faq";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoLanding({ draft, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure como a landing pública vai aparecer para quem clicar no link de divulgação.
      </p>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="visual" className="gap-1">
            <Palette className="h-3 w-3" /> Visual
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="gap-1">
            <ListChecks className="h-3 w-3" /> Benefícios
          </TabsTrigger>
          <TabsTrigger value="provas" className="gap-1">
            <MessageSquareQuote className="h-3 w-3" /> Provas
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-1">
            <HelpCircle className="h-3 w-3" /> FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-5">
          <PassoLandingVisual draft={draft} onChange={onChange} />
        </TabsContent>
        <TabsContent value="beneficios" className="mt-5">
          <PassoLandingBeneficios draft={draft} onChange={onChange} />
        </TabsContent>
        <TabsContent value="provas" className="mt-5">
          <PassoLandingProvas draft={draft} onChange={onChange} />
        </TabsContent>
        <TabsContent value="faq" className="mt-5">
          <PassoLandingFaq draft={draft} onChange={onChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
