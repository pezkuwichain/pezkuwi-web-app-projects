import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  AlertTriangle,
  FileText,
  DollarSign
} from 'lucide-react';

interface Approval {
  id: string;
  proposalTitle: string;
  amount: number;
  category: string;
  requester: string;
  description: string;
  requiredSignatures: number;
  currentSignatures: number;
  signers: Array<{
    name: string;
    status: 'approved' | 'rejected' | 'pending';
    timestamp?: string;
    comment?: string;
  }>;
  deadline: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export const MultiSigApproval: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pending');
  
  const [approvals] = useState<Approval[]>([
    {
      id: '1',
      proposalTitle: 'Infrastructure Upgrade - Q1 2024',
      amount: 45000,
      category: 'Infrastructure',
      requester: 'Tech Team',
      description: 'Upgrade cloud infrastructure for improved performance',
      requiredSignatures: 3,
      currentSignatures: 1,
      signers: [
        { name: 'Alice', status: 'approved', timestamp: '2024-01-08 14:30', comment: 'Looks good' },
        { name: 'Bob', status: 'pending' },
        { name: 'Charlie', status: 'pending' },
        { name: 'Diana', status: 'pending' }
      ],
      deadline: '2024-01-20',
      status: 'pending'
    },
    {
      id: '2',
      proposalTitle: 'Developer Grants Program',
      amount: 100000,
      category: 'Development',
      requester: 'Dev Relations',
      description: 'Fund developer grants for ecosystem growth',
      requiredSignatures: 4,
      currentSignatures: 2,
      signers: [
        { name: 'Alice', status: 'approved', timestamp: '2024-01-07 10:15' },
        { name: 'Bob', status: 'approved', timestamp: '2024-01-07 11:45' },
        { name: 'Charlie', status: 'pending' },
        { name: 'Diana', status: 'pending' },
        { name: 'Eve', status: 'pending' }
      ],
      deadline: '2024-01-25',
      status: 'pending'
    }
  ]);

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const approvedApprovals = approvals.filter(a => a.status === 'approved');
  const rejectedApprovals = approvals.filter(a => a.status === 'rejected');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const ApprovalCard = ({ approval }: { approval: Approval }) => {
    const progress = (approval.currentSignatures / approval.requiredSignatures) * 100;
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{approval.proposalTitle}</CardTitle>
              <CardDescription>{approval.description}</CardDescription>
            </div>
            <Badge variant="outline">{approval.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">${approval.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Deadline: {approval.deadline}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Approval Progress</span>
              <span className="font-medium">
                {approval.currentSignatures}/{approval.requiredSignatures} signatures
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Signers</p>
            <div className="flex flex-wrap gap-2">
              {approval.signers.map((signer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {signer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{signer.name}</span>
                    {getStatusIcon(signer.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${(pendingApprovals.reduce((sum, a) => sum + a.amount, 0) / 1000).toFixed(0)}k
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Signers</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApprovals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.map(approval => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No approved proposals yet
              </CardContent>
            </Card>
          ) : (
            approvedApprovals.map(approval => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No rejected proposals
              </CardContent>
            </Card>
          ) : (
            rejectedApprovals.map(approval => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};