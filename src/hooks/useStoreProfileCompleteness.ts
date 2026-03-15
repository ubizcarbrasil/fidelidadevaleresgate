import { useMemo } from "react";

interface CompletenessStep {
  key: string;
  label: string;
  weight: number;
  filled: boolean;
}

interface CompletenessResult {
  percent: number;
  steps: CompletenessStep[];
  missingSteps: CompletenessStep[];
  isComplete: boolean;
  firstMissingIndex: number;
}

export function useStoreProfileCompleteness(store: any): CompletenessResult {
  return useMemo(() => {
    if (!store) return { percent: 0, steps: [], missingSteps: [], isComplete: false, firstMissingIndex: 0 };

    const steps: CompletenessStep[] = [
      { key: "logo", label: "Logomarca", weight: 15, filled: !!store.logo_url },
      { key: "banner", label: "Banner", weight: 15, filled: !!store.banner_url },
      { key: "basics", label: "Dados Básicos", weight: 20, filled: !!(store.name && store.description) },
      { key: "segment", label: "Segmento", weight: 15, filled: !!store.taxonomy_segment_id },
      { key: "contact", label: "Endereço e Contato", weight: 10, filled: !!store.address },
      { key: "gallery", label: "Galeria", weight: 10, filled: Array.isArray(store.gallery_urls) && store.gallery_urls.length > 0 },
      { key: "hours", label: "Horário", weight: 10, filled: Array.isArray(store.operating_hours_json) && store.operating_hours_json.length > 0 },
      { key: "review", label: "Revisão", weight: 5, filled: false }, // always last
    ];

    // Review is "filled" when all others are filled
    const allOthersFilled = steps.slice(0, -1).every(s => s.filled);
    steps[steps.length - 1].filled = allOthersFilled;

    const totalWeight = steps.reduce((sum, s) => sum + s.weight, 0);
    const filledWeight = steps.filter(s => s.filled).reduce((sum, s) => sum + s.weight, 0);
    const percent = Math.round((filledWeight / totalWeight) * 100);
    const missingSteps = steps.filter(s => !s.filled);
    const firstMissingIndex = steps.findIndex(s => !s.filled);

    return {
      percent,
      steps,
      missingSteps,
      isComplete: percent >= 95,
      firstMissingIndex: firstMissingIndex === -1 ? 0 : firstMissingIndex,
    };
  }, [store]);
}
