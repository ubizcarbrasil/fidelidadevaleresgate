import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, BookOpen, Lightbulb, ChevronRight } from "lucide-react";
import { getHelpForRoute, type HelpSection } from "@/lib/helpContent";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function SectionCard({ section, index }: { section: HelpSection; index: number }) {
  return (
    <AccordionItem value={`section-${index}`} className="border rounded-xl px-4 bg-card">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{section.title}</p>
            <p className="text-xs text-muted-foreground">{section.summary}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-3 pl-11">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passo a passo</p>
            <ol className="space-y-1.5">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          {section.tips && section.tips.length > 0 && (
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold flex items-center gap-1 text-accent-foreground">
                <Lightbulb className="h-3.5 w-3.5" /> Dicas
              </p>
              <ul className="space-y-1">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-accent-foreground" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ContextualHelpDrawer() {
  const location = useLocation();
  const help = getHelpForRoute(location.pathname);
  const [open, setOpen] = useState(false);

  if (!help) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 transition-all"
          aria-label="Ajuda"
        >
          <HelpCircle className="h-5 w-5 text-primary" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            {help.pageTitle} — Manual de instruções
          </DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-6" style={{ maxHeight: "calc(85vh - 80px)" }}>
          <Accordion type="multiple" defaultValue={["section-0"]} className="space-y-2">
            {help.sections.map((section, i) => (
              <SectionCard key={i} section={section} index={i} />
            ))}
          </Accordion>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
