-- Create super admin user (replace with your email)
INSERT INTO auth.users (id, email, email_confirmed_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@levyflow.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create super admin profile
INSERT INTO user_profiles (id, full_name, email, role, is_approved)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Administrator', 'admin@levyflow.com', 'super_admin', true)
ON CONFLICT (id) DO NOTHING;
