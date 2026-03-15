-- Migration 013: Add doctor location fields

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS parish TEXT,
ADD COLUMN IF NOT EXISTS office_address TEXT;

-- update auto-create profile on signup to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, parish, office_address)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'),
        NEW.raw_user_meta_data->>'parish',
        NEW.raw_user_meta_data->>'office_address'
    )
    ON CONFLICT (id) DO UPDATE SET
        parish = EXCLUDED.parish,
        office_address = EXCLUDED.office_address
    WHERE public.profiles.role = 'doctor';
    
    RETURN NEW;
END;
$$;
