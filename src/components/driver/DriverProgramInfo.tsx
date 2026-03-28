import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  ShoppingCart,
  Link2,
  Clock,
  Coins,
  Users,
  Gift,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface Props {
  whatsappNumber?: string;
  fontHeading?: string;
  onBack: () => void;
}

/* ── Accordion Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground pr-4">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ── Step Card ── */
function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
        >
          {icon}
        </div>
        <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: "hsl(var(--border))" }} />
      </div>
      <div className="pb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Passo {step}
        </span>
        <h3 className="text-sm font-bold text-foreground mt-0.5">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function DriverProgramInfo({ whatsappNumber, fontHeading, onBack }: Props) {
  const faqs = [
    {
      question: "O preço do produto muda?",
      answer:
        "Não! Você paga exatamente o mesmo valor anunciado no Mercado Livre. O preço não muda, a vantagem é o acúmulo de pontos.",
    },
    {
      question: "Posso comprar para outra pessoa?",
      answer:
        "Sim! Você pode comprar para amigos, familiares ou qualquer pessoa. Desde que use o link correto da Ubiz, os pontos vão para a sua conta.",
    },
    {
      question: "Por que precisa ser pelo link da Ubiz?",
      answer:
        "Porque quem confirma a compra é o próprio Mercado Livre. Sem o link correto, não há como validar a operação e gerar os pontos.",
    },
    {
      question: "Quanto tempo para os pontos entrarem?",
      answer:
        "Em média 30 a 40 dias após a compra. Esse prazo é do Mercado Livre para confirmar que não houve cancelamento ou devolução.",
    },
    {
      question: "Como usar os pontos acumulados?",
      answer:
        "Acesse a Loja de Resgate dentro do marketplace e troque seus pontos por produtos. Se tiver saldo suficiente, pode resgatar de forma integral sem pagar nada!",
    },
  ];

  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de enviar um link de produto do Mercado Livre para gerar pontos.")}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="max-w-lg mx-auto px-5 pt-4 pb-10">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <HelpCircle className="h-7 w-7" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1
            className="text-xl font-extrabold text-foreground"
            style={{ fontFamily: fontHeading }}
          >
            Como Funciona
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
            Transforme suas compras no Mercado Livre em pontos e resgate produtos grátis
          </p>
        </div>

        {/* Highlight card */}
        <div
          className="rounded-2xl p-5 mb-6 text-center"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <Coins className="h-8 w-8 mx-auto mb-2" style={{ color: "hsl(var(--primary))" }} />
          <p className="text-2xl font-extrabold text-foreground" style={{ fontFamily: fontHeading }}>
            R$ 1 = 1 Ponto
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cada real gasto no Mercado Livre vira 1 ponto na sua conta
          </p>
        </div>

        {/* Steps */}
        <h2
          className="text-base font-bold text-foreground mb-4"
          style={{ fontFamily: fontHeading }}
        >
          Passo a passo
        </h2>

        <div className="mb-8">
          <StepCard
            step={1}
            icon={<ShoppingCart className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Escolha o produto no Mercado Livre"
            description="Encontre o produto que deseja comprar no Mercado Livre normalmente."
          />
          <StepCard
            step={2}
            icon={<MessageCircle className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Envie o link para o WhatsApp da Ubiz"
            description="Copie o link do produto e envie para o WhatsApp oficial da Ubiz Car. Pode enviar o link, print ou informações do item."
          />
          <StepCard
            step={3}
            icon={<Link2 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Receba o link de pontuação"
            description="A Ubiz vai te devolver o link oficial de pontuação. IMPORTANTE: só com esse link sua compra poderá pontuar!"
          />
          <StepCard
            step={4}
            icon={<CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Compre pelo link correto"
            description="Finalize a compra usando EXATAMENTE o link que a Ubiz enviou. Não use outro link ou acesso diferente."
          />
          <StepCard
            step={5}
            icon={<Clock className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Aguarde a validação (30-40 dias)"
            description="O Mercado Livre confirma que a compra foi concluída sem cancelamento. Após isso, os pontos são creditados automaticamente."
          />
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
              >
                <Gift className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Resultado
              </span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                Use os pontos na Loja de Resgate!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Troque seus pontos acumulados por produtos na loja. Com saldo suficiente, resgate de forma 100% integral!
              </p>
            </div>
          </div>
        </div>

        {/* Bonus: buy for others */}
        <div
          className="rounded-2xl p-4 mb-6 flex gap-3"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <Users className="h-8 w-8 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
          <div>
            <h3 className="text-sm font-bold text-foreground">Compre para quem quiser!</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Amigos, familiares ou conhecidos podem comprar pelo seu link. Os pontos vão para a sua conta, desde que o processo correto seja seguido.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <h2
          className="text-base font-bold text-foreground mb-3"
          style={{ fontFamily: fontHeading }}
        >
          Perguntas frequentes
        </h2>
        <div className="space-y-2.5 mb-8">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* WhatsApp CTA */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-opacity active:opacity-80"
            style={{
              backgroundColor: "#25D366",
              color: "#fff",
            }}
          >
            <MessageCircle className="h-5 w-5" />
            Enviar link do produto via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
