import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  helpLink?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, helpLink, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground leading-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          {description}
          {helpLink && (
            <a
              href={helpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
            >
              Saiba mais <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
