import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, AtSign, Heart, Award, TrendingUp, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'vote' | 'badge' | 'proposal';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  sender?: {
    name: string;
    avatar: string;
  };
}

export const NotificationCenter: React.FC = () => {
  const { subscribe, unsubscribe } = useWebSocket();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    mentions: true,
    replies: true,
    votes: true,
    badges: true,
    proposals: true,
    pushEnabled: false,
  });

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Subscribe to WebSocket events
    const handleMention = (data: Record<string, unknown>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'mention',
        title: 'You were mentioned',
        message: `${data.sender} mentioned you in a discussion`,
        timestamp: new Date(),
        read: false,
        actionUrl: data.url,
        sender: data.senderInfo,
      };
      addNotification(notification);
    };

    const handleReply = (data: Record<string, unknown>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'reply',
        title: 'New reply',
        message: `${data.sender} replied to your comment`,
        timestamp: new Date(),
        read: false,
        actionUrl: data.url,
        sender: data.senderInfo,
      };
      addNotification(notification);
    };

    subscribe('mention', handleMention);
    subscribe('reply', handleReply);

    return () => {
      unsubscribe('mention', handleMention);
      unsubscribe('reply', handleReply);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, unsubscribe]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
    });

    // Show push notification if enabled
    if (settings.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention': return <AtSign className="h-4 w-4" />;
      case 'reply': return <MessageCircle className="h-4 w-4" />;
      case 'vote': return <Heart className="h-4 w-4" />;
      case 'badge': return <Award className="h-4 w-4" />;
      case 'proposal': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <TabsContent value="all" className="p-0">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  {notifications.length} notifications
                </span>
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              </div>
              <ScrollArea className="h-96">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-accent cursor-pointer ${
                      !notification.read ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="p-0">
              <ScrollArea className="h-96">
                {notifications.filter(n => !n.read).map(notification => (
                  <div
                    key={notification.id}
                    className="p-4 border-b hover:bg-accent cursor-pointer bg-accent/50"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push">Push Notifications</Label>
                  <Switch
                    id="push"
                    checked={settings.pushEnabled}
                    onCheckedChange={(checked) => {
                      if (checked && 'Notification' in window) {
                        Notification.requestPermission().then(permission => {
                          setSettings(prev => ({ ...prev, pushEnabled: permission === 'granted' }));
                        });
                      } else {
                        setSettings(prev => ({ ...prev, pushEnabled: checked }));
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentions">Mentions</Label>
                  <Switch
                    id="mentions"
                    checked={settings.mentions}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, mentions: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="replies">Replies</Label>
                  <Switch
                    id="replies"
                    checked={settings.replies}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, replies: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};