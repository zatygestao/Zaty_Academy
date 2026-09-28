-- ==============================================================================
-- ZATY ACADEMY — CORREÇÃO DE POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Permite operações de leitura e escrita completas pelo frontend da Zaty Academy
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/orqtjzbteeewmtnbmmoh/sql/new
-- ==============================================================================

-- 1. SOLICITAÇÕES DE ATUALIZAÇÃO DE CURSO
ALTER TABLE public.academy_course_update_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage course update requests" ON public.academy_course_update_requests;
DROP POLICY IF EXISTS "Public read course update requests" ON public.academy_course_update_requests;
DROP POLICY IF EXISTS "Allow all on academy_course_update_requests" ON public.academy_course_update_requests;

CREATE POLICY "Allow all on academy_course_update_requests" ON public.academy_course_update_requests
  FOR ALL USING (true) WITH CHECK (true);


-- 2. REQUERIMENTOS DE CERTIFICADO
ALTER TABLE public.academy_certificate_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage certificate requests" ON public.academy_certificate_requests;
DROP POLICY IF EXISTS "Public read certificate requests" ON public.academy_certificate_requests;
DROP POLICY IF EXISTS "Allow all on academy_certificate_requests" ON public.academy_certificate_requests;

CREATE POLICY "Allow all on academy_certificate_requests" ON public.academy_certificate_requests
  FOR ALL USING (true) WITH CHECK (true);


-- 3. NOTIFICAÇÕES OPERACIONAIS
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage notifications" ON public.academy_notifications;
DROP POLICY IF EXISTS "Public read notifications" ON public.academy_notifications;
DROP POLICY IF EXISTS "Allow all on academy_notifications" ON public.academy_notifications;

CREATE POLICY "Allow all on academy_notifications" ON public.academy_notifications
  FOR ALL USING (true) WITH CHECK (true);


-- 4. LOGS DE AUDITORIA
ALTER TABLE public.academy_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage audit logs" ON public.academy_audit_logs;
DROP POLICY IF EXISTS "Public read audit logs" ON public.academy_audit_logs;
DROP POLICY IF EXISTS "Allow all on academy_audit_logs" ON public.academy_audit_logs;

CREATE POLICY "Allow all on academy_audit_logs" ON public.academy_audit_logs
  FOR ALL USING (true) WITH CHECK (true);


-- 5. RECARREGAR O CACHE DE SCHEMA DO POSTGREST
NOTIFY pgrst, 'reload schema';
