-- ==============================================================================
-- ZATY ACADEMY — SEGURANÇA MÁXIMA DAS CREDENCIAIS PROVISÓRIAS DO FORMADOR
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/orqtjzbteeewmtnbmmoh/sql
-- ==============================================================================

-- 1. GARANTIR COLUNA DE RASTREIO DO E-MAIL PROVISÓRIO
ALTER TABLE public.academy_teachers 
ADD COLUMN IF NOT EXISTS provisional_email text;

-- 2. FUNÇÃO SECURITY DEFINER PARA FINALIZAR O PRIMEIRO ACESSO E INVALIDAR O E-MAIL PROVISÓRIO
CREATE OR REPLACE FUNCTION public.finalize_teacher_credentials_setup(
  new_email text,
  new_password text,
  provisional_email text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  caller_id uuid;
  clean_new_email text;
  clean_prov_email text;
  existing_user_id uuid;
  teacher_record record;
BEGIN
  -- Identificador do utilizador autenticado no Supabase
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado: inicie sessão para concluir a configuração.';
  END IF;

  clean_new_email := lower(trim(new_email));
  IF clean_new_email IS NULL OR clean_new_email = '' OR clean_new_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'O endereço de e-mail informado não é válido.';
  END IF;

  IF provisional_email IS NOT NULL AND provisional_email <> '' THEN
    clean_prov_email := lower(trim(provisional_email));
  ELSE
    SELECT lower(email) INTO clean_prov_email FROM auth.users WHERE id = caller_id;
  END IF;

  IF clean_new_email = clean_prov_email THEN
    RAISE EXCEPTION 'O novo e-mail deve ser diferente do e-mail provisório institucional.';
  END IF;

  -- Obter registo do formador
  SELECT * INTO teacher_record FROM public.academy_teachers 
  WHERE user_id = caller_id OR lower(email) = clean_prov_email
  LIMIT 1;

  -- Verificar se as credenciais já foram configuradas anteriormente (bloqueio definitivo)
  IF teacher_record IS NOT NULL AND teacher_record.must_change_password = false THEN
    RAISE EXCEPTION 'As credenciais deste Formador já foram configuradas anteriormente. O e-mail definitivo está bloqueado.';
  END IF;

  -- Verificar prazo estrito de 48 horas nas credenciais temporárias
  IF teacher_record IS NOT NULL AND teacher_record.temporary_credentials_expires_at IS NOT NULL THEN
    IF now() > teacher_record.temporary_credentials_expires_at THEN
      RAISE EXCEPTION 'O prazo de 48 horas para a ativação inicial das suas credenciais provisórias expirou. Solicite um novo acesso ao Administrador da Zaty Academy.';
    END IF;
  END IF;

  -- Se já existia outra conta com o novo e-mail (ex: testes anteriores), remove a duplicata com segurança
  SELECT id INTO existing_user_id FROM auth.users WHERE lower(email) = clean_new_email AND id <> caller_id;
  IF existing_user_id IS NOT NULL THEN
    DELETE FROM public.academy_profiles WHERE id = existing_user_id;
    DELETE FROM auth.users WHERE id = existing_user_id;
  END IF;

  -- ATUALIZAÇÃO DIRETA EM auth.users:
  -- O e-mail do formador é atualizado para o NOVO E-MAIL REAL DEFINITIVO.
  -- Desta forma, o e-mail provisório DEIXA DE EXISTIR em auth.users imediatamente,
  -- tornando IMPOSSÍVEL qualquer login posterior usando o e-mail provisório.
  UPDATE auth.users
  SET 
    email = clean_new_email,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) 
      || jsonb_build_object(
        'email', clean_new_email, 
        'provisional_email_invalidated', clean_prov_email,
        'credentials_configured_at', now()
      ),
    updated_at = now()
  WHERE id = caller_id;

  -- Garantir que nenhuma conta orfã permaneça com o e-mail provisório
  IF clean_prov_email IS NOT NULL AND clean_prov_email <> '' THEN
    DELETE FROM auth.users WHERE lower(email) = clean_prov_email AND id <> caller_id;
  END IF;

  -- Atualizar academy_profiles
  UPDATE public.academy_profiles
  SET 
    email = clean_new_email,
    role = 'formador',
    must_change_password = false,
    updated_at = now()
  WHERE id = caller_id;

  -- Atualizar academy_teachers:
  -- Grava o e-mail real, arquiva o provisório, elimina senhas temporárias e desativa must_change_password
  IF teacher_record IS NOT NULL THEN
    UPDATE public.academy_teachers
    SET 
      email = clean_new_email,
      provisional_email = clean_prov_email,
      user_id = caller_id,
      specialties = jsonb_build_array('__INVALIDATED_PROVISIONAL_EMAIL__::' || clean_prov_email)::text,
      must_change_password = false,
      temporary_credentials_created_at = NULL,
      temporary_credentials_expires_at = NULL,
      is_blocked = false,
      updated_at = now()
    WHERE id = teacher_record.id;
  ELSE
    UPDATE public.academy_teachers
    SET 
      email = clean_new_email,
      provisional_email = clean_prov_email,
      specialties = jsonb_build_array('__INVALIDATED_PROVISIONAL_EMAIL__::' || clean_prov_email)::text,
      must_change_password = false,
      temporary_credentials_created_at = NULL,
      temporary_credentials_expires_at = NULL,
      is_blocked = false,
      updated_at = now()
    WHERE user_id = caller_id;
  END IF;

  -- Invalidar sessões de refresh antigas
  DELETE FROM auth.refresh_tokens WHERE user_id = caller_id::text;

  RETURN jsonb_build_object(
    'success', true,
    'new_email', clean_new_email,
    'invalidated_email', clean_prov_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ALIAS update_teacher_email PARA COMPATIBILIDADE
CREATE OR REPLACE FUNCTION public.update_teacher_email(new_email text)
RETURNS boolean AS $$
DECLARE
  res jsonb;
BEGIN
  res := public.finalize_teacher_credentials_setup(new_email, NULL, NULL);
  RETURN (res->>'success')::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: BLOQUEIO DEFINITIVO DE ALTERAÇÃO DO E-MAIL REAL PELO FORMADOR
CREATE OR REPLACE FUNCTION public.prevent_teacher_email_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o formador já concluiu o primeiro acesso (must_change_password = false)
  -- e o e-mail está a ser modificado por um utilizador comum (não administrador):
  IF (OLD.must_change_password = false AND lower(OLD.email) IS DISTINCT FROM lower(NEW.email)) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.academy_profiles 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    ) THEN
      RAISE EXCEPTION 'O e-mail definitivo do Formador está permanentemente bloqueado e não pode ser alterado pelo utilizador.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_teacher_email_tampering ON public.academy_teachers;
CREATE TRIGGER trg_prevent_teacher_email_tampering
  BEFORE UPDATE ON public.academy_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_teacher_email_tampering();

-- 5. CONCEDER PERMISSÕES DE EXECUÇÃO
GRANT EXECUTE ON FUNCTION public.finalize_teacher_credentials_setup(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_teacher_credentials_setup(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_teacher_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_teacher_email(text) TO anon;

-- 6. RECARREGAR O CACHE DO SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';
