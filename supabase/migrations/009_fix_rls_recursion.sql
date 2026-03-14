-- ============================================================
-- Migration 009: Fix RLS Infinite Recursion
-- ============================================================

-- rewrite into plpgsql to stop RLS recursion loop
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    found_role public.user_role;
BEGIN
    SELECT role INTO found_role FROM public.profiles WHERE id = auth.uid();
    RETURN found_role;
END;
$$;
