import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, HelpCircle, MessageCircle, PlayCircle, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreTermosTab() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Termos e Uso</h1>
        <p className="text-sm text-muted-foreground">Políticas e regulamentos da plataforma</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Termos de Uso do Lojista
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
          <p>
            Ao utilizar a plataforma Vale Resgate como lojista parceiro, você concorda com os seguintes termos:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Todas as ofertas criadas devem ser honradas conforme os termos configurados no cupom.</li>
            <li>O lojista é responsável por validar o PIN + CPF do cliente antes de conceder o benefício.</li>
            <li>Ofertas com informações falsas ou enganosas serão removidas e poderão resultar em suspensão.</li>
            <li>O valor de crédito informado no cupom deve ser aplicado integralmente na compra do cliente.</li>
            <li>A plataforma reserva-se o direito de auditar resgates e suspender contas em caso de irregularidades.</li>
            <li>Dados pessoais de clientes devem ser tratados conforme a LGPD.</li>
          </ul>
          <p className="text-xs text-muted-foreground/70 pt-2">
            Última atualização: Fevereiro de 2026
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Política de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Os dados coletados durante o cadastro e operação da loja são utilizados exclusivamente para fins operacionais
            da plataforma. Não compartilhamos informações com terceiros sem consentimento.
          </p>
          <p>
            Para mais informações sobre como seus dados são tratados, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function StoreTutorialTab() {
  const tutorials = [
    { title: "Como criar seu primeiro cupom", desc: "Passo a passo para configurar uma oferta com escalonamento de valores", icon: PlayCircle },
    { title: "Validando resgates com PIN + CPF", desc: "Aprenda a confirmar resgates dos clientes no seu estabelecimento", icon: PlayCircle },
    { title: "Configurando seu perfil público", desc: "Adicione fotos, vídeo, descrição e links para atrair mais clientes", icon: PlayCircle },
    { title: "Gerenciando funcionários", desc: "Cadastre operadores que poderão validar resgates na loja", icon: PlayCircle },
    { title: "Entendendo o extrato financeiro", desc: "Acompanhe ganhos, resgates e métricas do seu estabelecimento", icon: PlayCircle },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tutorial</h1>
        <p className="text-sm text-muted-foreground">Aprenda a usar todos os recursos da plataforma</p>
      </div>

      <div className="space-y-3">
        {tutorials.map((t, i) => {
          const Icon = t.icon;
          return (
            <Card key={i} className="rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StoreSuporteTab() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-sm text-muted-foreground">Precisa de ajuda? Estamos aqui para você</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">WhatsApp</h3>
            <p className="text-xs text-muted-foreground">Atendimento rápido por mensagem</p>
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" /> Abrir WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">E-mail</h3>
            <p className="text-xs text-muted-foreground">Para questões mais detalhadas</p>
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="mailto:suporte@valeresgate.com.br">
                <ExternalLink className="h-3 w-3" /> Enviar E-mail
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {[
            { q: "Como altero meu cupom após criado?", a: "Acesse o menu Cupom, clique na oferta desejada e edite as configurações." },
            { q: "Posso ter mais de uma filial?", a: "Sim, o módulo Filiais permite cadastrar e gerenciar múltiplas unidades." },
            { q: "Como funciona o PIN de resgate?", a: "O cliente recebe um PIN de 6 dígitos ao resgatar. Na loja, valide com PIN + CPF." },
            { q: "Posso cancelar um resgate já confirmado?", a: "Resgates confirmados não podem ser revertidos. Entre em contato com o suporte." },
          ].map((faq, i) => (
            <div key={i}>
              <p className="font-medium">{faq.q}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
