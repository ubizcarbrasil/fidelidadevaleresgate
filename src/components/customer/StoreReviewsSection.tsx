import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string;
}

interface StoreReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_id: string;
  customers: { name?: string } | null;
}

interface Props {
  storeId: string;
  customerId: string | undefined;
  primary: string;
  fontHeading: string;
  fg: string;
}

function mapReview(r: StoreReviewRow): Review {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    customer_name: r.customers?.name || "Cliente",
  };
}

export default function StoreReviewsSection({ storeId, customerId, primary, fontHeading, fg }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [storeId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("store_reviews")
      .select("id, rating, comment, created_at, customer_id, customers(name)")
      .eq("store_id", storeId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const rows = (data || []) as unknown as StoreReviewRow[];
    const mapped = rows.map(mapReview);

    setReviews(mapped);

    if (customerId) {
      const mine = rows.find(r => r.customer_id === customerId);
      if (mine) setMyReview(mapReview(mine));
    }
    setLoading(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Faça login para avaliar");
      return;
    }
    setSubmitting(true);

    const payload = {
      store_id: storeId,
      customer_id: customerId,
      rating,
      comment: comment.trim() || null,
    };

    const { error } = myReview
      ? await supabase.from("store_reviews").update({ rating, comment: comment.trim() || null }).eq("id", myReview.id)
      : await supabase.from("store_reviews").insert([payload] as Record<string, unknown>[]);

    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar avaliação");
    } else {
      toast.success(myReview ? "Avaliação atualizada!" : "Avaliação enviada!");
      setShowForm(false);
      setComment("");
      fetchReviews();
    }
  };

  const StarRating = ({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="cursor-pointer transition-colors"
          style={{
            width: size,
            height: size,
            color: s <= value ? "#FBBF24" : `${fg}20`,
            fill: s <= value ? "#FBBF24" : "none",
          }}
          onClick={() => onChange?.(s)}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
          Avaliações
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4" style={{ color: "#FBBF24", fill: "#FBBF24" }} />
            <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {customerId && !showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (myReview) { setRating(myReview.rating); setComment(myReview.comment || ""); }
            setShowForm(true);
          }}
          className="w-full mb-4 rounded-xl"
        >
          <Star className="h-4 w-4 mr-1" />
          {myReview ? "Editar minha avaliação" : "Avaliar este parceiro"}
        </Button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-card p-4 mb-4 space-y-3"
            style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
          >
            <p className="text-sm font-semibold">Sua nota</p>
            <StarRating value={rating} onChange={setRating} size={28} />
            <Textarea
              placeholder="Conte como foi sua experiência (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} size="sm" className="flex-1 rounded-xl" style={{ backgroundColor: primary }}>
                <Send className="h-4 w-4 mr-1" />
                {submitting ? "Enviando..." : "Enviar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-xl">
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 opacity-40">
          <Star className="h-8 w-8 mx-auto mb-2" style={{ color: `${fg}30` }} />
          <p className="text-sm">Ainda não há avaliações</p>
          <p className="text-xs mt-1">Seja o primeiro a avaliar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl bg-card p-4"
              style={{ boxShadow: "0 2px 10px hsl(var(--foreground) / 0.03)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {review.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} size={14} />
              </div>
              {review.comment && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: `${fg}65` }}>
                  {review.comment}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
