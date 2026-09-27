-- ==============================================================================
-- ZATY ACADEMY — CORREÇÃO DA TABELA ACADEMY_CLASSES (COLUNA ROOM)
-- Execute este script no SQL Editor do Supabase para adicionar a coluna 'room'
-- e recarregar o schema cache do PostgREST imediatamente.
-- ==============================================================================

-- 1. Adicionar coluna room caso ainda não exista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'academy_classes' 
      AND column_name = 'room'
  ) THEN
    ALTER TABLE public.academy_classes 
    ADD COLUMN room text DEFAULT 'Sala 1 - Laboratório TI';
  END IF;
END $$;

-- 2. Atualizar turmas existentes que estejam sem sala definida
UPDATE public.academy_classes 
SET room = 'Sala 1 - Laboratório TI' 
WHERE room IS NULL OR room = '';

-- 3. Forçar o recarregamento imediato do cache de esquemas do PostgREST
NOTIFY pgrst, 'reload schema';
