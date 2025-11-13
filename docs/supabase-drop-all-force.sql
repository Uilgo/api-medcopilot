-- ============================================
-- SCRIPT PARA DROPAR TUDO - VERSÃO FORÇADA
-- ============================================
-- ⚠️ ATENÇÃO: Este script vai DELETAR TUDO!
-- Use esta versão se o script normal não funcionar
-- ============================================

-- DROPAR TUDO DE UMA VEZ (CASCADE remove todas as dependências)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Recriar permissões padrão do schema public
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Habilitar extensão UUID (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram removidas
SELECT 
  COUNT(*) as "Tabelas Restantes"
FROM information_schema.tables
WHERE table_schema = 'public';

-- Se retornar 0, significa que tudo foi removido! ✅

SELECT '✅ BANCO DE DADOS LIMPO COM SUCESSO (VERSÃO FORÇADA)!' as status;
