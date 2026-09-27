-- ==============================================================================
-- ZATY ACADEMY — SCRIPT MESTRE DE ATUALIZAÇÃO E POLÍTICAS RLS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para corrigir em definitivo:
-- 1. RLS de academy_courses, academy_team, academy_classes, academy_teachers
-- 2. Colunas de compatibilidade (name/full_name) em academy_teachers
-- 3. Tabela e RLS de auditoria (academy_audit_logs) com dados de autor e descrição
-- 4. Tabela e RLS de artigos institucionais (academy_articles)
-- 5. Tabela e RLS de métricas de recuperação de senha (academy_password_resets)
-- 6. Colunas enriquecidas de certificados (start_date, final_grade, etc.)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE FORMADORES (academy_teachers) — GARANTIR AMBAS AS COLUNAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  full_name text,
  email text NOT NULL,
  phone text,
  specialty text,
  bio text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garantir existência das duas colunas (name e full_name) para compatibilidade total
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='name') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='full_name') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN full_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='specialty') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN specialty text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='bio') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='phone') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='is_active') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

UPDATE public.academy_teachers 
SET name = COALESCE(name, full_name, 'Formador'),
    full_name = COALESCE(full_name, name, 'Formador')
WHERE name IS NULL OR full_name IS NULL;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE TURMAS (academy_classes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.academy_teachers(id) ON DELETE SET NULL,
  name text NOT NULL,
  schedule text NOT NULL,
  room text DEFAULT 'Sala 1 - Laboratório TI',
  start_date date,
  end_date date,
  max_students integer DEFAULT 20,
  current_students integer DEFAULT 0,
  status text DEFAULT 'aberta',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garantir coluna room caso a tabela academy_classes já existisse anteriormente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_classes' AND column_name='room') THEN
    ALTER TABLE public.academy_classes ADD COLUMN room text DEFAULT 'Sala 1 - Laboratório TI';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURANÇA RLS (COURSES, TEAM, CLASSES, TEACHERS)
-- Permite leitura para todos e gestão completa (INSERT, UPDATE, DELETE) para authenticated
-- ------------------------------------------------------------------------------

-- academy_courses
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_courses" ON public.academy_courses;
DROP POLICY IF EXISTS "Authenticated manage academy_courses" ON public.academy_courses;
CREATE POLICY "Public Read academy_courses" ON public.academy_courses 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_courses" ON public.academy_courses 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academy_course_modules
ALTER TABLE public.academy_course_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_course_modules" ON public.academy_course_modules;
DROP POLICY IF EXISTS "Authenticated manage academy_course_modules" ON public.academy_course_modules;
CREATE POLICY "Public Read academy_course_modules" ON public.academy_course_modules 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_course_modules" ON public.academy_course_modules 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academy_lessons
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_lessons" ON public.academy_lessons;
DROP POLICY IF EXISTS "Authenticated manage academy_lessons" ON public.academy_lessons;
CREATE POLICY "Public Read academy_lessons" ON public.academy_lessons 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_lessons" ON public.academy_lessons 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academy_team
ALTER TABLE public.academy_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_team" ON public.academy_team;
DROP POLICY IF EXISTS "Authenticated manage academy_team" ON public.academy_team;
CREATE POLICY "Public Read academy_team" ON public.academy_team 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_team" ON public.academy_team 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academy_classes
ALTER TABLE public.academy_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_classes" ON public.academy_classes;
DROP POLICY IF EXISTS "Authenticated manage academy_classes" ON public.academy_classes;
CREATE POLICY "Public Read academy_classes" ON public.academy_classes 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_classes" ON public.academy_classes 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academy_teachers
ALTER TABLE public.academy_teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_teachers" ON public.academy_teachers;
DROP POLICY IF EXISTS "Authenticated manage academy_teachers" ON public.academy_teachers;
DROP POLICY IF EXISTS "Admins manage academy_teachers" ON public.academy_teachers;
DROP POLICY IF EXISTS "Teachers update own profile" ON public.academy_teachers;

CREATE POLICY "Public Read academy_teachers" ON public.academy_teachers 
  FOR SELECT USING (true);

CREATE POLICY "Admins manage academy_teachers" ON public.academy_teachers 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_profiles 
      WHERE academy_profiles.id = auth.uid() 
        AND academy_profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Teachers update own profile" ON public.academy_teachers 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. TABELA DE AUDITORIA (academy_audit_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  action text NOT NULL,
  description text,
  resource_type text DEFAULT 'system',
  resource_id text,
  details jsonb,
  ip_address text,
  status text DEFAULT 'sucesso',
  created_at timestamptz DEFAULT now()
);

-- Garantir colunas essenciais na tabela de auditoria existente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_audit_logs' AND column_name='user_email') THEN
    ALTER TABLE public.academy_audit_logs ADD COLUMN user_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_audit_logs' AND column_name='user_name') THEN
    ALTER TABLE public.academy_audit_logs ADD COLUMN user_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_audit_logs' AND column_name='description') THEN
    ALTER TABLE public.academy_audit_logs ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_audit_logs' AND column_name='status') THEN
    ALTER TABLE public.academy_audit_logs ADD COLUMN status text DEFAULT 'sucesso';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_audit_logs' AND column_name='ip_address') THEN
    ALTER TABLE public.academy_audit_logs ADD COLUMN ip_address text;
  END IF;
END $$;

ALTER TABLE public.academy_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read audit_logs" ON public.academy_audit_logs;
DROP POLICY IF EXISTS "Admins only read audit_logs" ON public.academy_audit_logs;
DROP POLICY IF EXISTS "Allow any insert audit_logs" ON public.academy_audit_logs;

CREATE POLICY "Admins only read audit_logs" ON public.academy_audit_logs 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_profiles 
      WHERE academy_profiles.id = auth.uid() 
        AND academy_profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Allow any insert audit_logs" ON public.academy_audit_logs 
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE ARTIGOS INSTITUCIONAIS (academy_articles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  video_url text,
  status text DEFAULT 'publicado', -- 'rascunho', 'publicado', 'arquivado'
  target_audience text DEFAULT 'geral', -- 'geral', 'curso', 'estudante'
  target_course_id uuid REFERENCES public.academy_courses(id) ON DELETE SET NULL,
  target_student_id uuid REFERENCES public.academy_students(id) ON DELETE SET NULL,
  author_id uuid,
  author_name text DEFAULT 'Zaty Academy',
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.academy_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_articles" ON public.academy_articles;
DROP POLICY IF EXISTS "Authenticated manage academy_articles" ON public.academy_articles;

CREATE POLICY "Public Read academy_articles" ON public.academy_articles 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_articles" ON public.academy_articles 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE HISTÓRICO DE RECUPERAÇÃO DE SENHA (academy_password_resets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  status text DEFAULT 'pendente', -- 'pendente', 'concluido', 'expirado'
  ip_address text,
  user_agent text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.academy_password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read academy_password_resets" ON public.academy_password_resets;
DROP POLICY IF EXISTS "Allow any insert academy_password_resets" ON public.academy_password_resets;
DROP POLICY IF EXISTS "Authenticated manage academy_password_resets" ON public.academy_password_resets;

CREATE POLICY "Allow any insert academy_password_resets" ON public.academy_password_resets 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated manage academy_password_resets" ON public.academy_password_resets 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. CAMPOS COMPLEMENTARES DE CERTIFICADOS (academy_certificates)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_certificates' AND column_name='start_date') THEN
    ALTER TABLE public.academy_certificates ADD COLUMN start_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_certificates' AND column_name='final_grade') THEN
    ALTER TABLE public.academy_certificates ADD COLUMN final_grade text DEFAULT '16/20 Valores (Bom com Distinção)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_certificates' AND column_name='classification') THEN
    ALTER TABLE public.academy_certificates ADD COLUMN classification text DEFAULT 'Apto com Distinção';
  END IF;
END $$;

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read academy_certificates" ON public.academy_certificates;
DROP POLICY IF EXISTS "Authenticated manage academy_certificates" ON public.academy_certificates;
CREATE POLICY "Public Read academy_certificates" ON public.academy_certificates 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_certificates" ON public.academy_certificates 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. CONTAS EXCLUSIVAS DE FORMADORES & CREDENCIAIS TEMPORÁRIAS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='user_id') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='must_change_password') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN must_change_password boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='temporary_credentials_created_at') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN temporary_credentials_created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='temporary_credentials_expires_at') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN temporary_credentials_expires_at timestamptz DEFAULT (now() + interval '48 hours');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_teachers' AND column_name='is_blocked') THEN
    ALTER TABLE public.academy_teachers ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. SISTEMA DE TRABALHOS ACADÉMICOS (academy_assignments & submissions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.academy_teachers(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.academy_classes(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text DEFAULT '',
  description text DEFAULT '',
  attachment_url text,
  due_date timestamptz NOT NULL,
  max_score numeric DEFAULT 20,
  max_points numeric DEFAULT 20,
  weight numeric DEFAULT 1,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'arquivado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.academy_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'submetido' CHECK (status IN ('submetido', 'avaliado', 'devolvido')),
  grade numeric,
  feedback text,
  graded_at timestamptz,
  graded_by uuid REFERENCES public.academy_teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- RLS para Trabalhos
ALTER TABLE public.academy_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read assignments" ON public.academy_assignments;
DROP POLICY IF EXISTS "Teachers and admins manage assignments" ON public.academy_assignments;

CREATE POLICY "Authenticated read assignments" ON public.academy_assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers and admins manage assignments" ON public.academy_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS para Submissões
ALTER TABLE public.academy_assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read submissions" ON public.academy_assignment_submissions;
DROP POLICY IF EXISTS "Authenticated manage submissions" ON public.academy_assignment_submissions;

CREATE POLICY "Authenticated read submissions" ON public.academy_assignment_submissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage submissions" ON public.academy_assignment_submissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. CHAT ACADÉMICO, CHAT DE SUPORTE & DIRETRIZES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('academic', 'support', 'class_group', 'teacher_student', 'student_student')),
  student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  recipient_student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.academy_teachers(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.academy_classes(id) ON DELETE SET NULL,
  title text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'fechado', 'suspenso')),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garantir existência da coluna recipient_student_id se a tabela já existia
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_chat_conversations' AND column_name='recipient_student_id') THEN
    ALTER TABLE public.academy_chat_conversations ADD COLUMN recipient_student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.academy_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.academy_chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('estudante', 'formador', 'suporte', 'admin')),
  sender_name text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_chat_guidelines_accepted (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  version text DEFAULT '1.0',
  CONSTRAINT unique_user_guidelines UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.academy_chat_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'bloqueado' CHECK (status IN ('bloqueado', 'em_analise', 'reativado', 'rejeitado')),
  appeal_text text,
  appeal_submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text,
  blocked_at timestamptz DEFAULT now(),
  reactivated_at timestamptz
);

ALTER TABLE public.academy_chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated manage chat conversations" ON public.academy_chat_conversations;
CREATE POLICY "Authenticated manage chat conversations" ON public.academy_chat_conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.academy_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated manage chat messages" ON public.academy_chat_messages;
CREATE POLICY "Authenticated manage chat messages" ON public.academy_chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.academy_chat_guidelines_accepted ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated manage chat guidelines" ON public.academy_chat_guidelines_accepted;
CREATE POLICY "Authenticated manage chat guidelines" ON public.academy_chat_guidelines_accepted
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.academy_chat_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated manage chat blocks" ON public.academy_chat_blocks;
CREATE POLICY "Authenticated manage chat blocks" ON public.academy_chat_blocks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. SISTEMA DE PRESENÇA REAL ONLINE VIA HEARTBEAT (academy_user_presence)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  full_name text NOT NULL,
  student_code text,
  avatar_url text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read academy_user_presence" ON public.academy_user_presence;
DROP POLICY IF EXISTS "Authenticated manage academy_user_presence" ON public.academy_user_presence;

CREATE POLICY "Public read academy_user_presence" ON public.academy_user_presence
  FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_user_presence" ON public.academy_user_presence
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 12. ATUALIZAÇÃO DOS DADOS OFICIAIS DA INSTITUIÇÃO (ZATY ACADEMY — NAMPULA)
-- ------------------------------------------------------------------------------
UPDATE public.academy_settings
SET 
  address = 'Namicopo – Nampula, Moçambique (Próximo à 3ª Esquadra)',
  phone = '+258 834 847 306',
  phone_alt = '834 847 306',
  whatsapp_number = '+258 834 847 306',
  updated_at = now()
WHERE id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 13. REFRESH DO SCHEMA CACHE DO POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

