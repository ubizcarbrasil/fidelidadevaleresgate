import { Monitor, Smartphone, Eye } from "lucide-react";

interface ContextBadgeProps {
  mode: "admin" | "preview" | "published";
  brandName?: string;
  impersonating?: boolean;
}

const CONFIG = {
  admin: { label: "Painel Admin", icon: Monitor, className: "bg-primary/10 text-primary border-primary/20" },
  preview: { label: "Preview Cliente", icon: Smartphone, className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400" },
  published: { label: "Publicado", icon: Eye, className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400" },
};

export function ContextBadge({ mode, brandName, impersonating }: ContextBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[mode];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0 glass-card ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-40 dot-pulse" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      {impersonating && brandName && (
        <span className="opacity-70 truncate max-w-[100px]">· {brandName}</span>
      )}
    </div>
  );
}
