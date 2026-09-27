-- ==============================================================================
-- ZATY ACADEMY — MIGRATION: REQUERIMENTO DE CERTIFICADOS & INSCRIÇÕES ABERTAS
-- ==============================================================================

-- 1. TABELA DE REQUERIMENTOS DE CERTIFICADO (academy_certificate_requests)
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cert_req_student ON public.academy_certificate_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_req_status ON public.academy_certificate_requests(status);
CREATE INDEX IF NOT EXISTS idx_cert_req_course ON public.academy_certificate_requests(course_id);

-- RLS para Requerimentos de Certificado
ALTER TABLE public.academy_certificate_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students and authenticated manage certificate requests" ON public.academy_certificate_requests;
DROP POLICY IF EXISTS "Public read certificate requests" ON public.academy_certificate_requests;

CREATE POLICY "Students and authenticated manage certificate requests" ON public.academy_certificate_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. GARANTIR COLUNAS DE EDITAL E INSCRIÇÕES ABERTAS EM academy_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_notice_enabled') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_notice_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_title') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_title text DEFAULT 'Edital Oficial de Inscrições e Matrículas 2026';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_period') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_period text DEFAULT 'Ano Letivo 2026 • Inscrições Abertas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_requirements') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_requirements text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_conditions') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_conditions text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_procedures') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_procedures text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_settings' AND column_name='enrollment_schedule_info') THEN
    ALTER TABLE public.academy_settings ADD COLUMN enrollment_schedule_info text;
  END IF;
END $$;

-- Recarregar cache de esquema do PostgREST
NOTIFY pgrst, 'reload schema';
