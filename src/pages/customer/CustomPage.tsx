import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import PagePreview from "@/components/page-builder/PagePreview";
import type { PageElement } from "@/components/page-builder/types";

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [elements, setElements] = useState<PageElement[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setTitle(data.title);
        setElements((data.elements_json as any) || []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <p>Página não encontrada</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <PagePreview elements={elements} />
    </div>
  );
}
