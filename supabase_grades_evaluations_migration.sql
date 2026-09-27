-- ==============================================================================
-- ZATY ACADEMY — MIGRATION: GESTÃO DE NOTAS, AVALIAÇÕES E AUDITORIA ACADÉMICA
-- Execute este script no SQL Editor do Supabase para provisionar o módulo completo:
-- 1. Tabela de Avaliações (academy_evaluations) - Testes teóricos/práticos, exames, recuperação
-- 2. Tabela de Notas dos Estudantes (academy_grades) - Lançamento bloqueado após confirmação
-- 3. Tabela de Auditoria de Retificação de Notas (academy_grade_audit_logs) - Justificativa obrigatória
-- 4. Políticas de Segurança RLS e Permissões
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE AVALIAÇÕES (academy_evaluations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.academy_classes(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.academy_teachers(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.academy_assignments(id) ON DELETE SET NULL,
  title text NOT NULL,
  evaluation_type text NOT NULL DEFAULT 'teste_teorico',
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric NOT NULL DEFAULT 1.0,
  max_score numeric NOT NULL DEFAULT 20.0,
  passing_grade numeric NOT NULL DEFAULT 10.0,
  is_recovery boolean NOT NULL DEFAULT false,
  recovery_for_evaluation_id uuid REFERENCES public.academy_evaluations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberta',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_eval_type CHECK (evaluation_type IN ('teste_teorico', 'teste_pratico', 'trabalho_casa', 'exame_teorico', 'exame_pratico', 'outro'))
);

-- Suporte a migração de tabela existente
ALTER TABLE public.academy_evaluations ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.academy_assignments(id) ON DELETE SET NULL;
ALTER TABLE public.academy_evaluations DROP CONSTRAINT IF EXISTS chk_eval_type;
ALTER TABLE public.academy_evaluations ADD CONSTRAINT chk_eval_type CHECK (evaluation_type IN ('teste_teorico', 'teste_pratico', 'trabalho_casa', 'exame_teorico', 'exame_pratico', 'outro'));

CREATE INDEX IF NOT EXISTS idx_academy_evaluations_class ON public.academy_evaluations(class_id);
CREATE INDEX IF NOT EXISTS idx_academy_evaluations_course ON public.academy_evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_evaluations_teacher ON public.academy_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_academy_evaluations_assignment ON public.academy_evaluations(assignment_id);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE NOTAS DOS ESTUDANTES (academy_grades)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.academy_evaluations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.academy_classes(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  status text NOT NULL DEFAULT 'confirmada',
  is_locked boolean NOT NULL DEFAULT true,
  is_recovery boolean NOT NULL DEFAULT false,
  original_grade_id uuid REFERENCES public.academy_grades(id) ON DELETE SET NULL,
  observations text,
  graded_by_teacher_id uuid REFERENCES public.academy_teachers(id) ON DELETE SET NULL,
  graded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_grade_score CHECK (score >= 0 AND score <= 20),
  CONSTRAINT uq_eval_student UNIQUE (evaluation_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_grades_student ON public.academy_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_academy_grades_evaluation ON public.academy_grades(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_academy_grades_class ON public.academy_grades(class_id);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE AUDITORIA DE ALTERAÇÃO DE NOTAS (academy_grade_audit_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_grade_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.academy_grades(id) ON DELETE CASCADE,
  evaluation_id uuid REFERENCES public.academy_evaluations(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.academy_students(id) ON DELETE CASCADE,
  changed_by_user_id uuid,
  changed_by_name text,
  changed_by_role text DEFAULT 'admin',
  previous_score numeric NOT NULL,
  new_score numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grade_audit_grade ON public.academy_grade_audit_logs(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_audit_student ON public.academy_grade_audit_logs(student_id);

-- ------------------------------------------------------------------------------
-- 4. HABILITAÇÃO DE RLS E POLÍTICAS DE ACESSO
-- ------------------------------------------------------------------------------
ALTER TABLE public.academy_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_grade_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para academy_evaluations
DROP POLICY IF EXISTS "Public Read academy_evaluations" ON public.academy_evaluations;
DROP POLICY IF EXISTS "Authenticated manage academy_evaluations" ON public.academy_evaluations;
CREATE POLICY "Public Read academy_evaluations" ON public.academy_evaluations FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_evaluations" ON public.academy_evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage academy_evaluations" ON public.academy_evaluations FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para academy_grades
DROP POLICY IF EXISTS "Public Read academy_grades" ON public.academy_grades;
DROP POLICY IF EXISTS "Authenticated manage academy_grades" ON public.academy_grades;
CREATE POLICY "Public Read academy_grades" ON public.academy_grades FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_grades" ON public.academy_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage academy_grades" ON public.academy_grades FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para academy_grade_audit_logs
DROP POLICY IF EXISTS "Public Read academy_grade_audit_logs" ON public.academy_grade_audit_logs;
DROP POLICY IF EXISTS "Authenticated manage academy_grade_audit_logs" ON public.academy_grade_audit_logs;
CREATE POLICY "Public Read academy_grade_audit_logs" ON public.academy_grade_audit_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated manage academy_grade_audit_logs" ON public.academy_grade_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage academy_grade_audit_logs" ON public.academy_grade_audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. ATUALIZAÇÃO DO CACHE SCHEMA POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
