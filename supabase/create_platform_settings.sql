-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public settings like name)
CREATE POLICY "Everyone can read platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Allow admins to update settings
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert default settings if not exists
INSERT INTO public.platform_settings (key, value)
VALUES 
    ('general', '{"platformName": "Tutorly", "supportEmail": "support@tutorly.com", "commissionRate": 15}'),
    ('features', '{"notifications": true, "maintenance": false, "registration": true, "teacherApproval": true}')
ON CONFLICT (key) DO NOTHING;
