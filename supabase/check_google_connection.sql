-- Create a function to check if a user has a Google connection
CREATE OR REPLACE FUNCTION check_google_connection(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.identities
        WHERE auth.identities.user_id = check_google_connection.user_id
        AND provider = 'google'
    );
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
