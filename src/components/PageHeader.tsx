import { ExternalLink } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  helpLink?: string;
}

export default function PageHeader({ title, description, helpLink }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
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
  );
}
