

## Plano: Redesign profissional da Landing Page de Parceiros

Sim, entendi perfeitamente — é a **Partner Landing Page** (`/:slug/parceiro`) no arquivo `src/pages/PartnerLandingPage.tsx`.

### O que será feito

Reescrever completamente o `PartnerLandingPage.tsx` inspirado na referência `ubiz-shop-connect.lovable.app`, mantendo o sistema dinâmico existente (dados vindos do `partner_landing_config` + cores/logo da marca).

### Seções da nova LP (inspiradas na referência)

1. **Hero** — Headline grande com destaque em cor da marca, subtítulo, CTA principal + botão secundário, vídeo embed opcional (campo `hero_image_url` aceita URL do YouTube)
2. **Barra de números** — Contadores animados (já existente, será polido)
3. **Benefícios** — Grid 3x2 com ícones, títulos e descrições mais detalhados no estilo da referência ("Mais clientes no caixa", "Menor CAC", "Vendas incrementais", etc.)
4. **Como funciona** — 4 passos verticais com numeração grande (01, 02, 03, 04) e linha conectora, no estilo da referência
5. **Modelos de participação** — NOVA SEÇÃO: 3 cards (Parceiro de Resgate, Emissor de Pontos, Modelo Completo com badge "Recomendado") com lista de benefícios e CTA individual — configurável via novo campo `models_json` no config, com fallback hardcoded
6. **FAQ** — Expandido para 15 perguntas no estilo da referência, com accordion animado
7. **CTA final** — Seção com mascote/ícone, headline e dois botões (cadastro + WhatsApp)
8. **Footer** — Logo + copyright

### Mudanças técnicas

- **Arquivo único**: `src/pages/PartnerLandingPage.tsx` — reescrita completa
- **Backward compatible**: Todos os campos do `partner_landing_config` continuam funcionando. Novos campos (`models_json`) terão fallback no código
- **Sem migração de banco**: Os defaults no código cobrem o conteúdo da referência
- **Animações**: Framer Motion mantido, com efeitos de parallax e hover mais sofisticados
- **Visual**: Dark theme com glassmorphism, gradientes mais ricos, tipografia mais impactante, espaçamento generoso

### O que NÃO muda
- Roteamento (`/:slug/parceiro`)
- Lógica de fetch de dados (brands + partner_landing_config)
- Sistema de cores dinâmicas (HSL da marca)
- Banco de dados (sem migrations)

