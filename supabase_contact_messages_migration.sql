-- ==============================================================================
-- ZATY ACADEMY — MIGRATION: GESTÃO PROFISSIONAL DE MENSAGENS DE CONTACTO
-- Tabela: academy_contact_messages
-- Inclui: Respostas, Thread/Histórico, Estado de Leitura, Prioridades, RLS e Realtime
-- ==============================================================================

-- 1. CRIAR OU ATUALIZAR TABELA academy_contact_messages
CREATE TABLE IF NOT EXISTS public.academy_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'respondido', 'arquivado')),
  admin_notes text,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at timestamptz,
  ip_address text,
  details jsonb DEFAULT '{}'::jsonb,
  replies jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garantir novas colunas caso a tabela já exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_contact_messages' AND column_name='replies') THEN
    ALTER TABLE public.academy_contact_messages ADD COLUMN replies jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_contact_messages' AND column_name='is_read') THEN
    ALTER TABLE public.academy_contact_messages ADD COLUMN is_read boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_contact_messages' AND column_name='read_at') THEN
    ALTER TABLE public.academy_contact_messages ADD COLUMN read_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_contact_messages' AND column_name='read_by') THEN
    ALTER TABLE public.academy_contact_messages ADD COLUMN read_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_contact_messages' AND column_name='priority') THEN
    ALTER TABLE public.academy_contact_messages ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente'));
  END IF;
END $$;

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.academy_contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.academy_contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.academy_contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_phone ON public.academy_contact_messages(phone);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.academy_contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON public.academy_contact_messages(priority);

-- 3. PERMISSÕES E GRANTS
GRANT ALL ON TABLE public.academy_contact_messages TO anon, authenticated, service_role;

-- 4. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.academy_contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on academy_contact_messages" ON public.academy_contact_messages;
DROP POLICY IF EXISTS "Allow staff select on academy_contact_messages" ON public.academy_contact_messages;
DROP POLICY IF EXISTS "Allow staff update on academy_contact_messages" ON public.academy_contact_messages;
DROP POLICY IF EXISTS "Allow staff delete on academy_contact_messages" ON public.academy_contact_messages;
DROP POLICY IF EXISTS "Allow authenticated all on academy_contact_messages" ON public.academy_contact_messages;

-- A. Inserção pública para visitantes (mesmo anónimos)
CREATE POLICY "Allow public insert on academy_contact_messages" 
  ON public.academy_contact_messages 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- B. Leitura exclusiva para equipa autenticada (Admin, Super Admin, Secretaria)
CREATE POLICY "Allow staff select on academy_contact_messages" 
  ON public.academy_contact_messages 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- C. Atualização e Respostas exclusivas para equipa autenticada
CREATE POLICY "Allow staff update on academy_contact_messages" 
  ON public.academy_contact_messages 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- D. Eliminação restrita à equipa autenticada
CREATE POLICY "Allow staff delete on academy_contact_messages" 
  ON public.academy_contact_messages 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- 5. ADICIONAR À PUBLICAÇÃO REALTIME DO SUPABASE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'academy_contact_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_contact_messages;
    RAISE NOTICE 'Tabela academy_contact_messages adicionada à publicação supabase_realtime com sucesso.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso Realtime: %', SQLERRM;
END $$;
