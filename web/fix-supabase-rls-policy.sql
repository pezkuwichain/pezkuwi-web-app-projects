ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "authenticated_read_admin_roles" ON admin_roles;

CREATE POLICY "authenticated_read_admin_roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (true);
