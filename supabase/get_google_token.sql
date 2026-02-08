-- Function to safely retrieve a user's google provider token from the auth schema
-- This must be run as a superuser/admin
CREATE OR REPLACE FUNCTION get_user_google_token(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator
AS $$
DECLARE
    token_data jsonb;
BEGIN
    SELECT 
        jsonb_build_object('provider_token', provider_token)
    INTO token_data
    FROM auth.identities
    WHERE user_id = get_user_google_token.user_id
    AND provider = 'google'
    LIMIT 1;

    RETURN token_data;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_google_token(uuid) TO service_role;
