-- ============================================================
-- Migration 009: Fix RLS Infinite Recursion
-- ============================================================

-- Rewrite current_user_role to use plpgsql and reset search_path
-- This prevents the security definer function from being macro-inlined
-- and from triggering RLS on public.profiles recursively for the same user.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    found_role public.user_role;
BEGIN
    SELECT role INTO found_role FROM public.profiles WHERE id = auth.uid();
    RETURN found_role;
END;
$$;
