/**
 * Sheet para avaliar adversário após duelo finalizado.
 */
import React, { useState } from "react";
import { ArrowLeft, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitRating, TAGS_AVALIACAO } from "./hook_avaliacao_duelo";

interface Props {
  duelId: string;
  raterCustomerId: string;
  ratedCustomerId: string;
  opponentName: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AvaliacaoDueloSheet({
  duelId,
  raterCustomerId,
  ratedCustomerId,
  opponentName,
  onBack,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const { mutate: submit, isPending } = useSubmitRating();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    submit(
      {
        duel_id: duelId,
        rater_customer_id: raterCustomerId,
        rated_customer_id: ratedCustomerId,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      },
      { onSuccess }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">Avaliar Adversário</h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-6">
        {/* Opponent info */}
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Como foi o duelo com</p>
          <p className="text-lg font-bold text-foreground">{opponentName}?</p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform active:scale-90"
            >
              <Star
                className="h-10 w-10"
                fill={star <= rating ? "hsl(var(--warning))" : "transparent"}
                style={{
                  color: star <= rating ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                }}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {rating === 1 && "Ruim"}
            {rating === 2 && "Regular"}
            {rating === 3 && "Bom"}
            {rating === 4 && "Muito bom"}
            {rating === 5 && "Excelente!"}
          </p>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Tags rápidas</p>
          <div className="flex flex-wrap gap-2">
            {TAGS_AVALIACAO.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? "hsl(var(--primary) / 0.15)"
                      : "hsl(var(--muted))",
                    color: isSelected
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))",
                    border: isSelected
                      ? "1px solid hsl(var(--primary) / 0.3)"
                      : "1px solid transparent",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Comentário <span className="text-muted-foreground font-normal">(opcional)</span>
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            placeholder="Algo sobre o adversário..."
            rows={3}
            className="resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {comment.length}/200
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isPending}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Enviando..." : "Enviar Avaliação"}
        </Button>
      </div>
    </div>
  );
}
