-- ============================================
-- STORAGE BUCKETS - SUPABASE
-- ============================================
-- Criar buckets e configurar RLS para armazenamento de arquivos
-- Buckets em português brasileiro
-- ============================================

-- ============================================
-- 1. CRIAR BUCKETS
-- ============================================

-- Bucket: avatares (fotos de perfil dos usuários)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatares',
  'avatares',
  true, -- Público (URLs acessíveis sem autenticação)
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: audios-consultas (áudios das consultas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios-consultas',
  'audios-consultas',
  false, -- Privado (requer autenticação)
  104857600, -- 100MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: documentos-pacientes (documentos anexados aos pacientes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-pacientes',
  'documentos-pacientes',
  false, -- Privado
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

SELECT '✅ BUCKETS CRIADOS' as status;

-- ============================================
-- 2. VERIFICAR RLS (já habilitada por padrão no Supabase)
-- ============================================

-- Nota: RLS já está habilitada por padrão na tabela storage.objects
-- Não é necessário executar ALTER TABLE (requer permissões de owner)

SELECT '✅ RLS JÁ HABILITADA NO STORAGE (padrão Supabase)' as status;

-- ============================================
-- 3. POLICIES RLS - BUCKET: avatares
-- ============================================

-- SELECT: Qualquer pessoa pode visualizar avatares (público)
DROP POLICY IF EXISTS "avatares_visualizar_publico" ON storage.objects;
CREATE POLICY "avatares_visualizar_publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatares');

-- INSERT: Usuários autenticados podem fazer upload do próprio avatar
DROP POLICY IF EXISTS "avatares_upload_proprio" ON storage.objects;
CREATE POLICY "avatares_upload_proprio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatares'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: Usuários podem atualizar apenas o próprio avatar
DROP POLICY IF EXISTS "avatares_atualizar_proprio" ON storage.objects;
CREATE POLICY "avatares_atualizar_proprio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatares'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: Usuários podem deletar apenas o próprio avatar
DROP POLICY IF EXISTS "avatares_deletar_proprio" ON storage.objects;
CREATE POLICY "avatares_deletar_proprio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatares'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

SELECT '✅ POLICIES DO BUCKET avatares CRIADAS' as status;


-- ============================================
-- 4. POLICIES RLS - BUCKET: audios-consultas
-- ============================================

-- SELECT: Membros do workspace podem visualizar áudios das consultas
DROP POLICY IF EXISTS "audios_visualizar_membros" ON storage.objects;
CREATE POLICY "audios_visualizar_membros"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audios-consultas'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- INSERT: ADMIN/PROFESSIONAL podem fazer upload de áudios
DROP POLICY IF EXISTS "audios_upload_profissionais" ON storage.objects;
CREATE POLICY "audios_upload_profissionais"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audios-consultas'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'PROFESSIONAL')
        AND ativo = true
    )
  );

-- UPDATE: ADMIN/PROFESSIONAL podem atualizar áudios do workspace
DROP POLICY IF EXISTS "audios_atualizar_profissionais" ON storage.objects;
CREATE POLICY "audios_atualizar_profissionais"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audios-consultas'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'PROFESSIONAL')
        AND ativo = true
    )
  );

-- DELETE: Apenas ADMIN pode deletar áudios
DROP POLICY IF EXISTS "audios_deletar_admin" ON storage.objects;
CREATE POLICY "audios_deletar_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audios-consultas'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role = 'ADMIN'
        AND ativo = true
    )
  );

SELECT '✅ POLICIES DO BUCKET audios-consultas CRIADAS' as status;

-- ============================================
-- 5. POLICIES RLS - BUCKET: documentos-pacientes
-- ============================================

-- SELECT: Membros do workspace podem visualizar documentos
DROP POLICY IF EXISTS "documentos_visualizar_membros" ON storage.objects;
CREATE POLICY "documentos_visualizar_membros"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos-pacientes'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- INSERT: ADMIN/PROFESSIONAL podem fazer upload de documentos
DROP POLICY IF EXISTS "documentos_upload_profissionais" ON storage.objects;
CREATE POLICY "documentos_upload_profissionais"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos-pacientes'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'PROFESSIONAL')
        AND ativo = true
    )
  );

-- UPDATE: ADMIN/PROFESSIONAL podem atualizar documentos
DROP POLICY IF EXISTS "documentos_atualizar_profissionais" ON storage.objects;
CREATE POLICY "documentos_atualizar_profissionais"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documentos-pacientes'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'PROFESSIONAL')
        AND ativo = true
    )
  );

-- DELETE: ADMIN/PROFESSIONAL podem deletar documentos
DROP POLICY IF EXISTS "documentos_deletar_profissionais" ON storage.objects;
CREATE POLICY "documentos_deletar_profissionais"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos-pacientes'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'PROFESSIONAL')
        AND ativo = true
    )
  );

SELECT '✅ POLICIES DO BUCKET documentos-pacientes CRIADAS' as status;

-- ============================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar buckets criados
SELECT 
  id as "Bucket",
  CASE WHEN public THEN '🌐 Público' ELSE '🔒 Privado' END as "Acesso",
  file_size_limit / 1048576 || ' MB' as "Tamanho Máximo",
  '✅' as "Status"
FROM storage.buckets
WHERE id IN ('avatares', 'audios-consultas', 'documentos-pacientes')
ORDER BY id;

-- Verificar policies criadas
SELECT 
  policyname as "Policy",
  tablename as "Tabela",
  cmd as "Operação",
  '✅' as "Status"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatares%'
     OR policyname LIKE '%audios%'
     OR policyname LIKE '%documentos%'
ORDER BY policyname;

SELECT '🎉 STORAGE CONFIGURADO COM SUCESSO!' as resultado;

-- ============================================
-- 7. ESTRUTURA DE PASTAS RECOMENDADA
-- ============================================

/*
ESTRUTURA DE PASTAS:

📁 avatares/
  └── {user_id}/
      └── avatar.jpg

📁 audios-consultas/
  └── {workspace_id}/
      └── {consultation_id}/
          └── audio-{timestamp}.mp3

📁 documentos-pacientes/
  └── {workspace_id}/
      └── {patient_id}/
          └── documento-{timestamp}.pdf

EXEMPLO DE UPLOAD (Node.js):

// Avatar
const avatarPath = `${userId}/avatar.jpg`;
await supabase.storage.from('avatares').upload(avatarPath, file);

// Áudio de consulta
const audioPath = `${workspaceId}/${consultationId}/audio-${Date.now()}.mp3`;
await supabase.storage.from('audios-consultas').upload(audioPath, file);

// Documento de paciente
const docPath = `${workspaceId}/${patientId}/documento-${Date.now()}.pdf`;
await supabase.storage.from('documentos-pacientes').upload(docPath, file);
*/
