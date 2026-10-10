-- Create profiles from auth metadata so email confirmation does not depend on
-- an authenticated client-side insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data ->> 'full_name'
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
