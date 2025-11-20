import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Monitor, Shield, LogOut, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
  profiles: {
    username: string;
    email: string;
  };
}

export function SessionMonitor() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch {
      if (import.meta.env.DEV) console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Session Terminated',
        description: 'The session has been successfully terminated.',
      });
      loadSessions();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to terminate session',
        variant: 'destructive',
      });
    }
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getActivityStatus = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) return { text: 'Active', variant: 'default' as const };
    if (minutes < 30) return { text: 'Idle', variant: 'secondary' as const };
    return { text: 'Inactive', variant: 'outline' as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => {
            const status = getActivityStatus(session.last_activity);
            return (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.profiles?.username}</span>
                      <Badge variant={status.variant}>
                        <Activity className="h-3 w-3 mr-1" />
                        {status.text}
                      </Badge>
                      {session.is_active && (
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>IP: {session.ip_address}</p>
                      <p>Device: {getDeviceInfo(session.user_agent)}</p>
                      <p>Started: {format(new Date(session.created_at), 'PPp')}</p>
                      <p>Last Activity: {format(new Date(session.last_activity), 'PPp')}</p>
                    </div>
                  </div>
                  {session.is_active && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => terminateSession(session.id)}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active sessions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}