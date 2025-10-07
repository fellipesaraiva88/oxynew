-- Migration: Fix authorized_owner_numbers schema
-- Data: 2025-10-03
-- Autor: Claude Code
-- Descrição: Corrigir schema para alinhar com código existente

-- 1. Adicionar coluna owner_name (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE public.authorized_owner_numbers 
    ADD COLUMN owner_name TEXT;
  END IF;
END $$;

-- 2. Adicionar coluna is_active (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.authorized_owner_numbers 
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 3. Adicionar coluna notes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.authorized_owner_numbers 
    ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 4. Adicionar coluna updated_at (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.authorized_owner_numbers 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 5. Migrar dados da coluna 'name' para 'owner_name' (se existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'name'
  ) THEN
    -- Copiar dados
    UPDATE public.authorized_owner_numbers 
    SET owner_name = name 
    WHERE owner_name IS NULL AND name IS NOT NULL;
    
    -- Remover coluna antiga
    ALTER TABLE public.authorized_owner_numbers 
    DROP COLUMN name;
  END IF;
END $$;

-- 6. Remover coluna is_primary se existir (não é usada)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authorized_owner_numbers' 
    AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE public.authorized_owner_numbers 
    DROP COLUMN is_primary;
  END IF;
END $$;

-- 7. Garantir que owner_name seja NOT NULL
ALTER TABLE public.authorized_owner_numbers 
ALTER COLUMN owner_name SET NOT NULL;

-- 8. Criar trigger de updated_at
CREATE OR REPLACE FUNCTION update_authorized_owner_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_authorized_owner_numbers_updated_at 
  ON public.authorized_owner_numbers;

CREATE TRIGGER trigger_authorized_owner_numbers_updated_at
  BEFORE UPDATE ON public.authorized_owner_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_authorized_owner_numbers_updated_at();

-- 9. Comentários para documentação
COMMENT ON TABLE public.authorized_owner_numbers IS 
  'Números de telefone autorizados para acessar Aurora (donos/admins da organização)';

COMMENT ON COLUMN public.authorized_owner_numbers.phone_number IS 
  'Número de telefone normalizado (apenas dígitos, sem formatação)';

COMMENT ON COLUMN public.authorized_owner_numbers.owner_name IS 
  'Nome completo do dono/admin autorizado';

COMMENT ON COLUMN public.authorized_owner_numbers.is_active IS 
  'Indica se o número está ativo (pode desativar sem deletar)';

COMMENT ON COLUMN public.authorized_owner_numbers.notes IS 
  'Notas administrativas sobre este owner';
