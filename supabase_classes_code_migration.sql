-- ==============================================================================
-- ZATY ACADEMY — CORREÇÃO DA TABELA ACADEMY_CLASSES (COLUNA CODE)
-- Execute este script no SQL Editor do Supabase se desejar garantir um DEFAULT
-- no nível de banco de dados para a coluna 'code' da tabela academy_classes.
-- ==============================================================================

-- 1. Garantir que a coluna code exista com tipo text/varchar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'academy_classes' 
      AND column_name = 'code'
  ) THEN
    ALTER TABLE public.academy_classes 
    ADD COLUMN code text;
  END IF;
END $$;

-- 2. Atualizar turmas existentes que estejam sem código definido
UPDATE public.academy_classes 
SET code = 'TUR-' || to_char(created_at, 'YYYY') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')
WHERE code IS NULL OR code = '';

-- 3. Definir valor DEFAULT automático no banco para que novas inserções nunca falhem
ALTER TABLE public.academy_classes 
ALTER COLUMN code SET DEFAULT ('TUR-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0'));

-- 4. Notificar PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
