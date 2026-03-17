import { Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { brandAlpha } from "@/lib/utils";

interface DayHours {
  day: string;
  open: string;
  close: string;
  is_open: boolean;
}

const DAY_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function getCurrentDay(): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return days[new Date().getDay()];
}

function isOpenNow(hours: DayHours[]): { open: boolean; today: DayHours | null } {
  const currentDay = getCurrentDay();
  const today = hours.find((h) => h.day === currentDay);
  if (!today || !today.is_open) return { open: false, today: today || null };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return { open: nowMinutes >= openMinutes && nowMinutes <= closeMinutes, today };
}

interface Props {
  hours: DayHours[];
  primary: string;
  fg: string;
}

export default function OperatingHoursDisplay({ hours, primary, fg }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!hours || hours.length === 0) return null;

  const { open, today } = isOpenNow(hours);
  const currentDay = getCurrentDay();

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: brandAlpha(primary, 0.06) }}
        >
          <Clock className="h-4 w-4" style={{ color: primary }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">Horário</p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: open ? "#22C55E15" : "#EF444415",
                color: open ? "#22C55E" : "#EF4444",
              }}
            >
              {open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
          {today && today.is_open && (
            <p className="text-[11px]" style={{ color: brandAlpha(fg, 0.33) }}>
              Hoje: {today.open} - {today.close}
            </p>
          )}
        </div>
        <ChevronDown
          className="h-4 w-4 transition-transform text-muted-foreground"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-10 space-y-1">
              {hours.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between text-xs py-1"
                  style={{
                    fontWeight: h.day === currentDay ? 700 : 400,
                    color: h.day === currentDay ? fg : brandAlpha(fg, 0.40),
                  }}
                >
                  <span>{h.day}</span>
                  <span>
                    {h.is_open ? `${h.open} - ${h.close}` : "Fechado"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
