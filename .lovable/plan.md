
## Fase 4.1b — Tentativa 2: ghost commit nos chunks-filhos

### Hipótese
O ghost commit anterior mudou só `pagina_central_modulos.tsx` (chunk pai). Os componentes `AbaEmpreendedores` e `AbaCidades` provavelmente são chunks separados pelo code-splitting do Vite, e o CDN do preview pode estar servindo versões antigas desses chunks-filhos. Forçar mudança no conteúdo dos próprios arquivos das abas deve gerar novos hashes para esses chunks específicos.

### Ação (3 edits triviais)

1. `src/features/central_modulos/components/aba_empreendedores.tsx` — adicionar após os imports:
```ts
export const __PHASE_4_1B_EMP_REBUILD = "2026-04-18-v3";
```

2. `src/features/central_modulos/components/aba_cidades.tsx` — adicionar após os imports:
```ts
export const __PHASE_4_1B_CID_REBUILD = "2026-04-18-v3";
```

3. Nenhuma outra mudança. Zero alteração de lógica, UI ou comportamento.

### Verificação após salvar (modo execução)
- `npm run build` (capturar exit code + tempo)
- `ls dist/assets/aba_empreendedores-*.js dist/assets/aba_cidades-*.js dist/assets/pagina_central_modulos-*.js` (capturar hashes novos)
- `grep -l "__PHASE_4_1B_EMP_REBUILD" dist/assets/*.js` (confirmar string no bundle)
- `grep -l "__PHASE_4_1B_CID_REBUILD" dist/assets/*.js` (confirmar string no bundle)
- `npx tsc --noEmit` (zero erros)

### Entrega ao usuário
- Exit code do build
- Hashes novos dos 3 chunks (ou confirmação se as abas estão inlined no chunk pai)
- Confirmação dos greps
- Instrução para o usuário testar no preview em Safari aba privada na URL `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app/admin/central-modulos`

### O que NÃO vou fazer
- Não publicar em produção
- Não tocar `vite.config.ts` / Service Worker
- Não tocar nada de 4.1a, 4.2, 4.3
- Não alterar lógica das abas

### Plano de escalação
Se mesmo após esse rebuild o preview continuar mostrando 2 abas:
- Entregar relatório técnico fechado (hashes antes/depois, greps, build limpo)
- Recomendar abertura de ticket com suporte do Lovable com evidência de cache CDN não invalidando chunks-filhos

### Risco
Mínimo. 2 linhas em 2 arquivos. Constantes não importadas em lugar nenhum. Rollback trivial.
