-- ==============================================================================
-- ZATY ACADEMY — MIGRAÇÃO: ATUALIZAÇÃO SEGURA DO E-MAIL DO FORMADOR (PRIMEIRO ACESSO)
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/orqtjzbteeewmtnbmmoh/sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_teacher_email(new_email text)
RETURNS boolean AS $$
DECLARE
  clean_email text;
  caller_id uuid;
BEGIN
  -- 1. Obter o identificador do utilizador autenticado
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado: inicie sessão para atualizar as credenciais.';
  END IF;

  -- 2. Normalizar e validar formato do novo e-mail
  clean_email := lower(trim(new_email));
  IF clean_email IS NULL OR clean_email = '' OR clean_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'O endereço de e-mail informado não é válido.';
  END IF;

  -- 3. Verificar se o novo e-mail já pertence a outra conta
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = clean_email AND id <> caller_id) THEN
    RAISE EXCEPTION 'Este endereço de e-mail já está associado a outra conta no sistema.';
  END IF;

  -- 4. Atualizar auth.users diretamente (sem disparo para o e-mail provisório)
  UPDATE auth.users
  SET 
    email = clean_email,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', clean_email),
    updated_at = now()
  WHERE id = caller_id;

  -- 5. Atualizar academy_profiles
  UPDATE public.academy_profiles
  SET 
    email = clean_email,
    updated_at = now()
  WHERE id = caller_id;

  -- 6. Atualizar academy_teachers (limpar credenciais temporárias e flags)
  UPDATE public.academy_teachers
  SET 
    email = clean_email,
    specialties = NULL,
    must_change_password = false,
    temporary_credentials_created_at = NULL,
    temporary_credentials_expires_at = NULL,
    is_blocked = false,
    updated_at = now()
  WHERE user_id = caller_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.update_teacher_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_teacher_email(text) TO anon;

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
