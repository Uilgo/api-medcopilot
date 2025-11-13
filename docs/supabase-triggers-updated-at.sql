-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
-- Atualiza automaticamente o campo updated_at
-- em todas as tabelas que possuem este campo
-- ============================================

-- ============================================
-- 1. CRIAR FUNÇÃO UNIVERSAL
-- ============================================

-- Função que atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CRIAR TRIGGERS NAS TABELAS
-- ============================================

-- Trigger: users
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_users ON public.users;
CREATE TRIGGER trigger_atualizar_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- Trigger: workspaces
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_workspaces ON public.workspaces;
CREATE TRIGGER trigger_atualizar_updated_at_workspaces
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- Trigger: patients
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_patients ON public.patients;
CREATE TRIGGER trigger_atualizar_updated_at_patients
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- Trigger: consultations
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_consultations ON public.consultations;
CREATE TRIGGER trigger_atualizar_updated_at_consultations
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- Trigger: analysis_results
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_analysis ON public.analysis_results;
CREATE TRIGGER trigger_atualizar_updated_at_analysis
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================
-- 3. VERIFICAÇÃO
-- ============================================

-- Listar todos os triggers criados
SELECT 
  trigger_name as "Trigger",
  event_object_table as "Tabela",
  '✅' as "Status"
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_atualizar_updated_at%'
ORDER BY event_object_table;

-- Verificar função criada
SELECT 
  routine_name as "Função",
  '✅' as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'atualizar_updated_at';

SELECT '🎉 TRIGGERS DE UPDATED_AT CRIADOS COM SUCESSO!' as resultado;

-- ============================================
-- 4. TESTE
-- ============================================

-- Testar trigger (exemplo com users)
-- UPDATE public.users SET nome = 'Teste' WHERE id = auth.uid();
-- SELECT nome, updated_at FROM public.users WHERE id = auth.uid();
-- O updated_at deve ter sido atualizado automaticamente!
