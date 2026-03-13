

## Diagnóstico: Seções ausentes na Home do Cliente

### Problemas identificados

Analisando o código de `CustomerHomePage.tsx`, encontrei que **várias seções que existem como componentes prontos nunca são importadas ou renderizadas na home**:

1. **`ForYouSection`** (Selecionados para Você) — existe em `src/components/customer/ForYouSection.tsx` mas NÃO é importado na home
2. **`AchadinhoSection`** (Achadinhos / Ofertas de afiliados) — existe em `src/components/customer/AchadinhoSection.tsx` mas NÃO é importado
3. **`EmissorasSection`** (Compre e Pontue / Emissoras de pontos) — existe em `src/components/customer/EmissorasSection.tsx` mas NÃO é importado
4. **Barra de busca** — existe um `<input>` decorativo que não abre o `CustomerSearchOverlay` existente
5. **Scroll lateral das seções CMS** — os carrosséis já usam `overflow-x-auto`, mas o `scrollbar-hide` pode estar faltando no CSS global, ou o container `max-w-lg` pode estar limitando a rolagem

### Plano de correção

#### 1. Adicionar as 3 seções ausentes ao `CustomerHomePage.tsx`
- Importar `ForYouSection`, `AchadinhoSection` e `EmissorasSection`
- Inserir na ordem correta entre o banner e as seções CMS dinâmicas:
  - Banner Carousel
  - Categorias (SegmentNavSection)
  - **ForYouSection** (Para Você)
  - **EmissorasSection** (Compre e Pontue)
  - **AchadinhoSection** (Achadinhos)
  - HomeSectionsRenderer (seções CMS dinâmicas)

#### 2. Conectar a barra de busca ao `CustomerSearchOverlay`
- Importar `CustomerSearchOverlay`
- Adicionar state `searchOpen`
- Ao clicar na barra de busca, abrir o overlay ao invés de usar o input decorativo

#### 3. Garantir scroll lateral funcional
- Verificar CSS global para `scrollbar-hide` utility
- Confirmar que os containers não bloqueiam o overflow horizontal

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/customer/CustomerHomePage.tsx` | Importar e renderizar ForYouSection, AchadinhoSection, EmissorasSection; conectar busca ao overlay |

### Impacto
- Nenhuma alteração em componentes existentes — apenas composição na home
- As seções só aparecem se tiverem dados (cada uma retorna `null` se vazio)

