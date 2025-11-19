import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Users, Settings, Activity, Shield, Bell, Trash2, Monitor, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SessionMonitor } from '@/components/security/SessionMonitor';
import { PermissionEditor } from '@/components/security/PermissionEditor';
import { SecurityAudit } from '@/components/security/SecurityAudit';
import { KycApprovalTab } from '@/components/admin/KycApprovalTab';
import { CommissionVotingTab } from '@/components/admin/CommissionVotingTab';
import { CommissionSetupTab } from '@/components/admin/CommissionSetupTab';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Load admin roles
      const { data: roles } = await supabase
        .from('admin_roles')
        .select('*');

      // Load system settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*');

      setUsers(profiles || []);
      setAdminRoles(roles || []);
      setSystemSettings(settings || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      if (role === 'none') {
        await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);
      } else {
        await supabase
          .from('admin_roles')
          .upsert({
            user_id: userId,
            role,
            updated_at: new Date().toISOString()
          });
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      loadAdminData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const sendNotification = async (userId: string) => {
    const title = prompt('Notification Title:');
    const message = prompt('Notification Message:');
    
    if (!title || !message) return;

    try {
      const { error } = await supabase.functions.invoke('notifications-manager', {
        body: {
          action: 'create',
          userId,
          title,
          message,
          type: 'info'
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification sent successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };

  const getUserRole = (userId: string) => {
    const role = adminRoles.find(r => r.user_id === userId);
    return role?.role || 'none';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-10 h-auto">
          <TabsTrigger value="setup" className="flex-col h-auto py-3">
            <Shield className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Commission<br/>Setup</span>
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex-col h-auto py-3">
            <Users className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">KYC<br/>Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex-col h-auto py-3">
            <Activity className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Commission<br/>Voting</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-col h-auto py-3">
            <Users className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex-col h-auto py-3">
            <Shield className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-col h-auto py-3">
            <Monitor className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex-col h-auto py-3">
            <Lock className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-col h-auto py-3">
            <AlertTriangle className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Security</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-col h-auto py-3">
            <Activity className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-col h-auto py-3">
            <Settings className="h-4 w-4 mb-1" />
            <span className="text-xs leading-tight">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kyc">
          <KycApprovalTab />
        </TabsContent>

        <TabsContent value="voting">
          <CommissionVotingTab />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.email_verified ? 'default' : 'secondary'}>
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getUserRole(user.id)}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendNotification(user.id)}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Notify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Admin Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminRoles.map((role) => {
                  const user = users.find(u => u.id === role.user_id);
                  return (
                    <div key={role.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{user?.username}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                      <Badge variant="outline">{role.role}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <SessionMonitor />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionEditor />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAudit />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity logs will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Maintenance Mode</Label>
                  <Select defaultValue="off">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Registration</Label>
                  <Select defaultValue="open">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="invite">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="setup">
          <CommissionSetupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}