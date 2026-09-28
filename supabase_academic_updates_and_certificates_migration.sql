-- ==============================================================================
-- ZATY ACADEMY — MIGRAÇÃO COMPLETA: ATUALIZAÇÕES DE CURSO & REQUERIMENTOS
-- ==============================================================================
-- Este script SQL deve ser executado no SQL Editor do painel Supabase:
-- https://supabase.com/dashboard/project/orqtjzbteeewmtnbmmoh/sql/new
--
-- O que este script faz:
-- 1. Cria a tabela oficial 'academy_course_update_requests' (Solicitações de Curso)
-- 2. Cria a tabela oficial 'academy_certificate_requests' (Requerimentos de Certificado)
-- 3. Assegura colunas essenciais na tabela 'academy_notifications'
-- 4. Cria índices de alta velocidade para filtragem e consultas
-- 5. Habilita políticas de segurança RLS (Row Level Security)
-- 6. Ativa as tabelas na publicação 'supabase_realtime' para sincronização instantânea
-- 7. Recarrega o cache de schema da API PostgREST
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE SOLICITAÇÕES DE ATUALIZAÇÃO DE CURSO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_course_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  previous_course_id uuid REFERENCES public.academy_courses(id) ON DELETE SET NULL,
  new_course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  reason text DEFAULT 'Solicitação direta de atualização de formação',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada_aguardando_pagamento', 'concluido', 'rejeitada')),
  admin_notes text,
  rejection_reason text,
  payment_status text DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'isento', 'pago', 'reembolsado')),
  payment_id uuid REFERENCES public.academy_payments(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices de performance para atualizações de curso
CREATE INDEX IF NOT EXISTS idx_course_upd_student ON public.academy_course_update_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_course_upd_status ON public.academy_course_update_requests(status);
CREATE INDEX IF NOT EXISTS idx_course_upd_new_course ON public.academy_course_update_requests(new_course_id);
CREATE INDEX IF NOT EXISTS idx_course_upd_prev_course ON public.academy_course_update_requests(previous_course_id);
CREATE INDEX IF NOT EXISTS idx_course_upd_created_at ON public.academy_course_update_requests(created_at DESC);

-- RLS para Atualizações de Curso
ALTER TABLE public.academy_course_update_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage course update requests" ON public.academy_course_update_requests;
DROP POLICY IF EXISTS "Public read course update requests" ON public.academy_course_update_requests;
DROP POLICY IF EXISTS "Allow all on academy_course_update_requests" ON public.academy_course_update_requests;

CREATE POLICY "Allow all on academy_course_update_requests" ON public.academy_course_update_requests
  FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 2. TABELA DE REQUERIMENTOS DE CERTIFICADO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_certificate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  purpose text NOT NULL DEFAULT 'Comprovação Curricular / Emprego',
  notes text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'pagamento_pendente', 'concluido', 'rejeitado')),
  admin_notes text,
  rejection_reason text,
  fee_amount numeric DEFAULT 0,
  payment_id uuid REFERENCES public.academy_payments(id) ON DELETE SET NULL,
  certificate_id uuid REFERENCES public.academy_certificates(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices de performance para requerimentos de certificado
CREATE INDEX IF NOT EXISTS idx_cert_req_student ON public.academy_certificate_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_req_status ON public.academy_certificate_requests(status);
CREATE INDEX IF NOT EXISTS idx_cert_req_course ON public.academy_certificate_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_cert_req_created_at ON public.academy_certificate_requests(created_at DESC);

-- RLS para Requerimentos de Certificado
ALTER TABLE public.academy_certificate_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage certificate requests" ON public.academy_certificate_requests;
DROP POLICY IF EXISTS "Public read certificate requests" ON public.academy_certificate_requests;
DROP POLICY IF EXISTS "Allow all on academy_certificate_requests" ON public.academy_certificate_requests;

CREATE POLICY "Allow all on academy_certificate_requests" ON public.academy_certificate_requests
  FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. GARANTIR ESTRUTURA E ÍNDICES EM academy_notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para carregamento instantâneo do sino de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread ON public.academy_notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.academy_notifications(created_at DESC);

-- RLS para Notificações
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage notifications" ON public.academy_notifications;
DROP POLICY IF EXISTS "Public read notifications" ON public.academy_notifications;
DROP POLICY IF EXISTS "Allow all on academy_notifications" ON public.academy_notifications;

CREATE POLICY "Allow all on academy_notifications" ON public.academy_notifications
  FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. ATIVAR SUPABASE REALTIME PARA SINCRONIZAÇÃO EM TEMPO REAL
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_course_update_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_certificate_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.academy_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- ------------------------------------------------------------------------------
-- 5. RECARREGAR O CACHE DE SCHEMA DO POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
