
Diagnóstico confirmado:
- O problema não é o link da Ubiz nem o banco.
- Em ambiente de teste (preview), `/{slug}/parceiro` funciona normalmente (validei `/ubiz-resgata/parceiro` e a landing abre).
- Em ambiente publicado (live), o mesmo caminho retorna o `NotFound` antigo.
- Você confirmou que ainda não clicou em Publish/Update após a correção.

Conclusão:
- O código corrigido está no ambiente de teste, mas ainda não foi promovido para o ambiente publicado.

Plano objetivo (sem alteração de código):
1) Publicar a versão atual
   - Desktop: botão Publish/Update no canto superior direito.
   - Mobile: `...` (canto inferior direito) → Publish → Update.
2) Revalidar em produção
   - Abrir: `https://fidelidadevaleresgate.lovable.app/ubiz-resgata/parceiro`
3) Se continuar 404, eliminar cache do navegador
   - Safari iPhone: recarregar forçado/abrir em aba anônima.
   - Testar também em outro navegador/dispositivo para confirmar cache local.
4) Verificação final
   - Confirmar que a LP abre, exibe marca “Ubiz Resgata” e CTA.

Plano de hardening (opcional, para evitar recorrência):
- Ajustar a tela de configuração da LP para mostrar dois links explícitos:
  - Link de teste (preview)
  - Link publicado (live)
- Exibir aviso na própria tela: “Mudanças só aparecem no domínio publicado após Publish/Update”.

Critérios de aceite:
- `https://fidelidadevaleresgate.lovable.app/ubiz-resgata/parceiro` abre a landing (não cai no 404).
- Link da LP funciona tanto em desktop quanto no mobile.

Detalhes técnicos:
- A rota existe no app: `/:slug/parceiro`.
- O preview já está servindo build com essa rota.
- O live ainda está com build anterior (sem a correção aplicada), por isso o comportamento divergente entre preview e domínio publicado.
