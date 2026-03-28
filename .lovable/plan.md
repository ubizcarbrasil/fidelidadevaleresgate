

# Corrigir criação de nova categoria — formulário invisível no mobile

## Problema
Ao clicar em "Nova Categoria", o formulário de criação aparece na **linha 373**, que fica **abaixo** do grande card de "Configurações — Detalhe do Achadinho" (banners + CTA). No mobile (430px), esse card é extenso e o formulário fica fora da tela, dando a impressão de que nada aconteceu.

## Solução

### Alteração em `src/pages/AffiliateCategoriesPage.tsx`

1. **Mover o bloco `{newForm && renderForm(...)}`** da linha 373 para logo após o botão "Nova Categoria" (após a linha 278), antes do card de configurações CTA.

2. **Adicionar scroll automático** com `useRef` + `scrollIntoView` para que, ao clicar em "Nova Categoria", a tela role automaticamente até o formulário no mobile.

Estrutura final:
```
Header + Botão "Nova Categoria"
→ Formulário de nova categoria (se aberto)  ← movido para cá
Card de Configurações CTA/Banners
Formulário de edição (se aberto)
Lista de categorias
```

Arquivo único afetado: `src/pages/AffiliateCategoriesPage.tsx`

