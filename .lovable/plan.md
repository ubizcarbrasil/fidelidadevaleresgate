

## Por que "Compre e Pontue" e "Para Você" não aparecem no Construtor

Essas duas seções (e também "Categorias" e "Achadinhos") são **componentes hardcoded** renderizados diretamente no `CustomerHomePage.tsx` — eles não existem na tabela `brand_sections` e por isso não aparecem no painel do Construtor de Páginas.

O Construtor só lista o que está salvo em `brand_sections` com `page_id = NULL` (sessões CMS dinâmicas). As seções nativas ficam fixas no código:

```text
CustomerHomePage.tsx (ordem fixa no código):
  1. HomeSectionsRenderer (banners)     ← CMS
  2. SegmentNavSection (categorias)     ← HARDCODED
  3. ForYouSection (para você)          ← HARDCODED
  4. EmissorasSection (compre e pontue) ← HARDCODED
  5. AchadinhoSection (achadinhos)      ← HARDCODED
  6. HomeSectionsRenderer (dinâmicas)   ← CMS
```

### Plano: Expor seções nativas no painel do Construtor

**Abordagem:** Adicionar cards representativos das seções nativas no `PageSectionsEditor` quando em modo Home, permitindo ativar/desativar e reordenar junto com as seções CMS.

#### 1. Criar configuração de seções nativas na marca

Usar um campo `home_layout_json` na tabela `brands` (ou uma nova tabela simples) para armazenar o estado de visibilidade e ordem das seções nativas:

```json
{
  "native_sections": [
    { "key": "CATEGORIES", "label": "Categorias", "enabled": true, "order": 1 },
    { "key": "FOR_YOU", "label": "Selecionado para Você", "enabled": true, "order": 2 },
    { "key": "EMISSORAS", "label": "Compre e Pontue", "enabled": true, "order": 3 },
    { "key": "ACHADINHOS", "label": "Achadinhos", "enabled": true, "order": 4 }
  ]
}
```

**Migração:** Adicionar coluna `home_layout_json` (jsonb, default null) em `brands`.

#### 2. Atualizar `PageSectionsEditor.tsx` (modo Home)

- Carregar `home_layout_json` da marca
- Exibir cards das seções nativas com visual diferenciado (badge "Nativa") junto com as seções CMS
- Permitir toggle on/off e reordenação (setas ▲▼)
- Salvar alterações de volta em `brands.home_layout_json`
- Não permitir exclusão/duplicação das nativas (apenas toggle e ordem)

#### 3. Atualizar `CustomerHomePage.tsx`

- Ler `home_layout_json` do brand context
- Renderizar seções nativas condicionalmente com base no `enabled`
- Respeitar a ordem definida, intercalando nativas e CMS na sequência correta

#### 4. Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Adicionar `home_layout_json` em `brands` |
| `PageSectionsEditor.tsx` | Buscar e exibir seções nativas + toggle/ordem |
| `CustomerHomePage.tsx` | Ler layout e renderizar condicionalmente na ordem |
| `BrandContext.tsx` | Expor `home_layout_json` no contexto (se não vier já) |

