import { Sparkles, Rocket, Zap, Crown, type LucideIcon } from "lucide-react";

export interface DefinicaoPlano {
  key: "free" | "starter" | "profissional" | "enterprise";
  label: string;
  icon: LucideIcon;
  colorClass: string; // tailwind text color class
}

export const PLANS: DefinicaoPlano[] = [
  { key: "free",         label: "Free",         icon: Sparkles, colorClass: "text-muted-foreground" },
  { key: "starter",      label: "Starter",      icon: Rocket,   colorClass: "text-blue-500" },
  { key: "profissional", label: "Profissional", icon: Zap,      colorClass: "text-purple-500" },
  { key: "enterprise",   label: "Enterprise",   icon: Crown,    colorClass: "text-amber-500" },
];

export type PlanKey = DefinicaoPlano["key"];
