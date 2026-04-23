-- Sprint 2 — Migration Corretiva: Taxonomia D2 dos 4 business_models de Resgate
-- Substitui sufixo _v2 (aplicado erroneamente) pela taxonomia correta parcial/integral + motorista/passageiro
--
-- ROLLBACK (caso necessário, executar manualmente):
-- BEGIN;
-- UPDATE business_models SET key='resgate_cidade_motorista_v2', name='Resgate na Cidade Motorista', updated_at=now() WHERE key='resgate_parcial_motorista';
-- UPDATE business_models SET key='resgate_pontos_motorista_v2', name='Resgate por Pontos Motorista', updated_at=now() WHERE key='resgate_integral_motorista';
-- UPDATE business_models SET key='resgate_cidade_cliente_v2',   name='Resgate na Cidade Cliente',   updated_at=now() WHERE key='resgate_parcial_passageiro';
-- UPDATE business_models SET key='resgate_pontos_cliente_v2',   name='Resgate por Pontos Cliente',  updated_at=now() WHERE key='resgate_integral_passageiro';
-- COMMIT;

BEGIN;

UPDATE business_models
   SET key='resgate_parcial_motorista',
       name='Resgate Parcial Motorista',
       updated_at=now()
 WHERE key='resgate_cidade_motorista_v2';

UPDATE business_models
   SET key='resgate_integral_motorista',
       name='Resgate Integral Motorista',
       updated_at=now()
 WHERE key='resgate_pontos_motorista_v2';

UPDATE business_models
   SET key='resgate_parcial_passageiro',
       name='Resgate Parcial Passageiro',
       updated_at=now()
 WHERE key='resgate_cidade_cliente_v2';

UPDATE business_models
   SET key='resgate_integral_passageiro',
       name='Resgate Integral Passageiro',
       updated_at=now()
 WHERE key='resgate_pontos_cliente_v2';

COMMIT;