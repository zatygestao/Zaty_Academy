-- ==============================================================================
-- MIGRAÇÃO SUPABASE: CAMPOS CIVIS E PESSOAIS PARA CERTIFICADOS (ZATY ACADEMY)
-- ==============================================================================
-- Adiciona colunas para armazenamento de naturalidade, distrito, província e filiação
-- diretamente na tabela academy_students.
-- ==============================================================================

ALTER TABLE public.academy_students
  ADD COLUMN IF NOT EXISTS naturalidade text DEFAULT 'Nampula',
  ADD COLUMN IF NOT EXISTS distrito text DEFAULT 'Nampula',
  ADD COLUMN IF NOT EXISTS provincia text DEFAULT 'Nampula',
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS mother_name text;

-- Atualizar comentários das colunas para documentação do schema
COMMENT ON COLUMN public.academy_students.naturalidade IS 'Localidade/Cidade de nascimento do aluno para emissão de certificados oficiais';
COMMENT ON COLUMN public.academy_students.distrito IS 'Distrito de nascimento do aluno';
COMMENT ON COLUMN public.academy_students.provincia IS 'Província de naturalidade do aluno';
COMMENT ON COLUMN public.academy_students.father_name IS 'Nome completo do pai (Filiação)';
COMMENT ON COLUMN public.academy_students.mother_name IS 'Nome completo da mãe (Filiação)';
