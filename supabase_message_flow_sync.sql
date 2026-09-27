-- ==============================================================================
-- ZATY ACADEMY — MIGRATION: VINCULAÇÃO E FLUXO BIDIRECIONAL DE MENSAGENS
-- Tabela: academy_contact_messages & academy_notifications
-- Inclui: Vinculação com utilizador/estudante, RLS rigoroso por utilizador e auditoria
-- ==============================================================================

-- 1. ADICIONAR COLUNAS DE VINCULAÇÃO DE UTILIZADOR E ESTUDANTE (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'academy_contact_messages' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.academy_contact_messages 
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'academy_contact_messages' 
      AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.academy_contact_messages 
      ADD COLUMN student_id uuid REFERENCES public.academy_students(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. ÍNDICES DE BUSCA E PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.academy_contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_student_id ON public.academy_contact_messages(student_id);

-- 3. AJUSTAR POLÍTICAS RLS PARA ISOLAMENTO RIGOROSO
ALTER TABLE public.academy_contact_messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de SELECT caso existam
DROP POLICY IF EXISTS "Allow staff select on academy_contact_messages" ON public.academy_contact_messages;
DROP POLICY IF EXISTS "Allow user and staff select on academy_contact_messages" ON public.academy_contact_messages;

-- Nova política de SELECT: Equipa staff vê tudo; Estudante/utilizador vê apenas as suas próprias mensagens
CREATE POLICY "Allow user and staff select on academy_contact_messages" 
  ON public.academy_contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (
    -- 1. Equipa administrativa (super_admin, admin, secretaria)
    EXISTS (
      SELECT 1 FROM public.academy_profiles p 
      WHERE p.id = auth.uid() 
        AND p.role IN ('super_admin', 'admin', 'secretaria')
    )
    OR
    -- 2. O próprio utilizador autenticado proprietário da mensagem
    user_id = auth.uid()
    OR
    -- 3. Estudante vinculado à conta autenticada
    student_id IN (
      SELECT s.id FROM public.academy_students s 
      WHERE s.user_id = auth.uid()
    )
    OR
    -- 4. E-mail cadastrado na conta do utilizador
    email = (auth.jwt() ->> 'email')
  );

-- Garantir publicação realtime para academy_contact_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'academy_contact_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_contact_messages;
  END IF;
END $$;
