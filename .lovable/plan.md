

## Plano: Sincronizar Preview da Marca com o App Real do Cliente

### Problema

O simulador de preview (`BrandThemePreview`) está desatualizado em relação ao app real do cliente. Comparando as screenshots com o código:

| Elemento | Preview atual | App real |
|---|---|---|
| Tabs inferiores | 4 (Início, Ofertas, Carteira, Perfil) | 5 (Início, Ofertas, **Resgates**, Carteira, Perfil) |
| Saudação | Nome na cor accent + emoji 👋 | Nome na cor **dourada (vb-gold)**, sem emoji |
| Saldo de pontos | Banner grande com cor accent | **Badge compacto dourado** à direita da saudação |
| Ações rápidas | Grid de 6 ícones | **Não existe** no app real |
| Localização | Ausente | Linha "Visualizando ofertas em: **Cidade**" |
| Cards "Para você" | Cards simples com iniciais coloridas | Cards com **imagem da oferta**, badge de pontos, nome da loja |
| Seção "Compre e pontue" | Ausente | Presente com avatares de lojas |

### Mudanças

**`src/components/BrandThemePreview.tsx`** — Reescrever a `HomeScreen` e ajustar tabs:

1. **Bottom tabs**: Adicionar tab "Resgates" (5 tabs como o app real)

2. **HomeScreen** — Reestruturar para espelhar o layout real:
   - **Saudação + Saldo**: Linha com greeting à esquerda (nome em dourado) e badge compacto de saldo à direita (fundo dourado)
   - **Localização**: Linha com ícone MapPin + "Visualizando ofertas em: **Centro**"
   - **Remover** o grid de Quick Actions (não existe no app)
   - **Remover** o banner grande de pontos com accent
   - **"Selecionados para você"**: Cards horizontais com área de imagem placeholder, badge de pontos no topo, título da oferta + nome da loja + pontos embaixo
   - **"Compre e pontue"**: Nova seção com avatares circulares/arredondados de lojas em scroll horizontal

3. **Cores do saldo**: Usar tom dourado fixo (`#D4A017` / `hsl(45 80% 45%)`) em vez da cor accent da marca, para refletir o `--vb-gold` do app real

| Arquivo | Ação |
|---|---|
| `src/components/BrandThemePreview.tsx` | Atualizar HomeScreen e tabs para espelhar o app real |

