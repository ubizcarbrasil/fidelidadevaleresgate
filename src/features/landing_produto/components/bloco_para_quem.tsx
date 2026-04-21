import { Smartphone, Users, Layers } from "lucide-react";

interface Props {
  primaryColor: string;
}

const PERFIS = [
  {
    icon: Smartphone,
    titulo: "Apps de mobilidade regional",
    descricao:
      "Plataformas locais e regionais que precisam reter base de motoristas e competir com gigantes nacionais via experiência.",
    tag: "Regional",
  },
  {
    icon: Users,
    titulo: "Cooperativas de motoristas",
    descricao:
      "Cooperativas que querem fortalecer identidade, criar pertencimento e dar reconhecimento contínuo aos cooperados.",
    tag: "Cooperativa",
  },
  {
    icon: Layers,
    titulo: "Plataformas white-label",
    descricao:
      "Empresas SaaS que vendem app de mobilidade pronto e querem entregar diferenciação real ao cliente final.",
    tag: "White-label",
  },
];

export default function BlocoParaQuem({ primaryColor }: Props) {
  return (
    <section
      id="para-quem"
      className="px-4 py-16 sm:py-20 bg-muted/30 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: primaryColor }}
          >
            Para quem é
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Feito para plataformas de <span style={{ color: primaryColor }}>mobilidade urbana</span>
          </h2>
          <p className="text-base text-muted-foreground">
            Se a retenção e o engajamento da sua base de motoristas é estratégico, o Duelo é pra você.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {PERFIS.map(({ icon: Icon, titulo, descricao, tag }) => (
            <div
              key={titulo}
              className="group relative rounded-2xl border bg-card p-6 sm:p-7 transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)`,
                      color: primaryColor,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: `${primaryColor}55`,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}11`,
                    }}
                  >
                    {tag}
                  </span>
                </div>
                <h3 className="font-bold text-lg leading-tight">{titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}