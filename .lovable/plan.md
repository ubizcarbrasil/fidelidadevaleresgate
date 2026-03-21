

## Plano: Corrigir scroll horizontal do carrossel de Achadinhos

### Problema
O carrossel horizontal de deals na seção Achadinhos não rola para o lado. O container `<main>` no `CustomerLayout` tem `overflow-y-auto` sem definir `overflow-x`, e em dispositivos móveis WebKit o scroll horizontal de containers filhos pode ser "engolido" pelo scroll vertical do pai.

### Solução

**1. `src/components/customer/CustomerLayout.tsx` (linha 310)**
- Adicionar `overflow-x-hidden` ao `<main>` para que o scroll horizontal seja delegado explicitamente aos containers internos:
  - De: `className="flex-1 pb-24 overflow-y-auto"`
  - Para: `className="flex-1 pb-24 overflow-y-auto overflow-x-hidden"`

**2. `src/components/customer/AchadinhoSection.tsx` (linha 146)**
- Garantir que a `<section>` não tenha `max-w-lg` bloqueando overflow. Trocar `max-w-lg mx-auto` por `w-full max-w-lg mx-auto` (pode não ser necessário, mas garante).
- Adicionar `touch-action: pan-x` no container de scroll dos deals (linha 224-228) para garantir que o gesto horizontal seja reconhecido no mobile:
  - Adicionar `style={{ scrollSnapType: "x mandatory", touchAction: "pan-x" }}`

### Arquivos envolvidos
- **Editar**: `src/components/customer/CustomerLayout.tsx` — adicionar `overflow-x-hidden` no main
- **Editar**: `src/components/customer/AchadinhoSection.tsx` — adicionar `touchAction: "pan-x"` no container de scroll

