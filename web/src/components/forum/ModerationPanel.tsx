import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Shield, Ban, CheckCircle, Clock, Flag, User, MessageSquare, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Report {
  id: string;
  type: 'spam' | 'harassment' | 'misinformation' | 'other';
  reportedContent: string;
  reportedBy: string;
  reportedUser: string;
  timestamp: string;
  status: 'pending' | 'reviewing' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}

export function ModerationPanel() {
  const { t } = useTranslation();
  const [autoModeration, setAutoModeration] = useState(true);
  const [sentimentThreshold, setSentimentThreshold] = useState(30);

  const reports: Report[] = [
    {
      id: '1',
      type: 'misinformation',
      reportedContent: 'False claims about proposal implementation...',
      reportedBy: 'User123',
      reportedUser: 'BadActor456',
      timestamp: '10 minutes ago',
      status: 'pending',
      severity: 'high'
    },
    {
      id: '2',
      type: 'spam',
      reportedContent: 'Repeated promotional content...',
      reportedBy: 'User789',
      reportedUser: 'Spammer101',
      timestamp: '1 hour ago',
      status: 'reviewing',
      severity: 'medium'
    }
  ];

  const moderationStats = {
    totalReports: 24,
    resolved: 18,
    pending: 6,
    bannedUsers: 3,
    flaggedContent: 12
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reviewing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{moderationStats.totalReports}</p>
              </div>
              <Flag className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{moderationStats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{moderationStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Banned Users</p>
                <p className="text-2xl font-bold text-red-600">{moderationStats.bannedUsers}</p>
              </div>
              <Ban className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged Content</p>
                <p className="text-2xl font-bold">{moderationStats.flaggedContent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">Reports Queue</TabsTrigger>
          <TabsTrigger value="settings">Auto-Moderation</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(report.status)}
                      <Badge className={getSeverityColor(report.severity)}>
                        {report.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{report.type}</Badge>
                      <span className="text-sm text-gray-500">{report.timestamp}</span>
                    </div>
                    <p className="font-medium mb-2">Reported User: {report.reportedUser}</p>
                    <p className="text-gray-600 mb-3">{report.reportedContent}</p>
                    <p className="text-sm text-gray-500">Reported by: {report.reportedBy}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                    <Button variant="destructive" size="sm">
                      Take Action
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Moderation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-mod">Enable Auto-Moderation</Label>
                  <p className="text-sm text-gray-600">Automatically flag suspicious content</p>
                </div>
                <Switch
                  id="auto-mod"
                  checked={autoModeration}
                  onCheckedChange={setAutoModeration}
                />
              </div>
              <div className="space-y-2">
                <Label>Sentiment Threshold</Label>
                <p className="text-sm text-gray-600">
                  Flag comments with sentiment below {sentimentThreshold}%
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sentimentThreshold}
                  onChange={(e) => setSentimentThreshold(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Auto-moderation uses AI to detect potentially harmful content and automatically flags it for review.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">BadActor456</p>
                      <p className="text-sm text-gray-600">3 reports, 2 warnings</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Warn</Button>
                    <Button variant="outline" size="sm">Suspend</Button>
                    <Button variant="destructive" size="sm">Ban</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}