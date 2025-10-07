-- ============================================
-- CLIENTS & PETS TABLES (7-9)
-- ============================================

-- 7. Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status contact_status NOT NULL DEFAULT 'new',
  source contact_source NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- 8. Pets
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species pet_species NOT NULL,
  breed TEXT,
  size pet_size,
  age_years INTEGER,
  weight_kg DECIMAL(5,2),
  color TEXT,
  gender TEXT,
  is_neutered BOOLEAN,
  birth_date DATE,
  medical_notes TEXT,
  behavioral_notes TEXT,
  vaccination_record JSONB DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'scheduled',
  price_cents INTEGER NOT NULL,
  notes TEXT,
  internal_notes TEXT,
  created_by booking_created_by NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
