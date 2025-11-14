import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, RefreshCw, Lock, Unlock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  is_system: boolean;
}

const PERMISSION_CATEGORIES = {
  governance: {
    title: 'Governance',
    permissions: {
      create_proposal: 'Create Proposals',
      vote_proposal: 'Vote on Proposals',
      delegate_vote: 'Delegate Voting Power',
      manage_treasury: 'Manage Treasury',
    }
  },
  moderation: {
    title: 'Moderation',
    permissions: {
      moderate_content: 'Moderate Content',
      ban_users: 'Ban Users',
      delete_posts: 'Delete Posts',
      pin_posts: 'Pin Posts',
    }
  },
  administration: {
    title: 'Administration',
    permissions: {
      manage_users: 'Manage Users',
      manage_roles: 'Manage Roles',
      view_analytics: 'View Analytics',
      system_settings: 'System Settings',
    }
  },
  security: {
    title: 'Security',
    permissions: {
      view_audit_logs: 'View Audit Logs',
      manage_sessions: 'Manage Sessions',
      configure_2fa: 'Configure 2FA',
      access_api: 'Access API',
    }
  }
};

export function PermissionEditor() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
      if (data && data.length > 0) {
        setSelectedRole(data[0]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (category: string, permission: string) => {
    if (!selectedRole || selectedRole.is_system) return;

    const fullPermission = `${category}.${permission}`;
    setSelectedRole({
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [fullPermission]: !selectedRole.permissions[fullPermission]
      }
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('roles')
        .update({ permissions: selectedRole.permissions })
        .eq('id', selectedRole.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPermissions = () => {
    if (!selectedRole) return;
    const original = roles.find(r => r.id === selectedRole.id);
    if (original) {
      setSelectedRole(original);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permission Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedRole?.id} onValueChange={(id) => {
          const role = roles.find(r => r.id === id);
          if (role) setSelectedRole(role);
        }}>
          <TabsList className="grid grid-cols-4 w-full">
            {roles.map(role => (
              <TabsTrigger key={role.id} value={role.id}>
                {role.name}
                {role.is_system && (
                  <Lock className="h-3 w-3 ml-1" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedRole && (
            <TabsContent value={selectedRole.id} className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRole.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                  {selectedRole.is_system && (
                    <Badge variant="secondary" className="mt-2">
                      <Lock className="h-3 w-3 mr-1" />
                      System Role (Read Only)
                    </Badge>
                  )}
                </div>
                {!selectedRole.is_system && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetPermissions}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={savePermissions}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="space-y-3">
                    <h4 className="font-medium text-sm">{category.title}</h4>
                    <div className="space-y-2">
                      {Object.entries(category.permissions).map(([permKey, permName]) => {
                        const fullPerm = `${categoryKey}.${permKey}`;
                        const isEnabled = selectedRole.permissions[fullPerm] || false;
                        
                        return (
                          <div key={permKey} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {isEnabled ? (
                                <Unlock className="h-4 w-4 text-green-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{permName}</span>
                            </div>
                            <Switch
                              checked={isEnabled}
                              disabled={selectedRole.is_system}
                              onCheckedChange={() => togglePermission(categoryKey, permKey)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}