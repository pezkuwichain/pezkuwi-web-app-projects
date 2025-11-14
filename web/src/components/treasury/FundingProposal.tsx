import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Calculator,
  FileText,
  Users,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  justification: string;
}

interface Milestone {
  id: string;
  title: string;
  deliverables: string;
  amount: number;
  deadline: string;
}

export const FundingProposal: React.FC = () => {
  const { t } = useTranslation();
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { id: '1', description: '', amount: 0, category: '', justification: '' }
  ]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: '', deliverables: '', amount: 0, deadline: '' }
  ]);

  const addBudgetItem = () => {
    setBudgetItems([...budgetItems, {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      category: '',
      justification: ''
    }]);
  };

  const removeBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  const updateBudgetItem = (id: string, field: keyof BudgetItem, value: any) => {
    setBudgetItems(budgetItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      id: Date.now().toString(),
      title: '',
      deliverables: '',
      amount: 0,
      deadline: ''
    }]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Proposal Header */}
      <Card>
        <CardHeader>
          <CardTitle>Create Funding Proposal</CardTitle>
          <CardDescription>Submit a detailed budget request for treasury funding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title</Label>
            <Input
              id="title"
              placeholder="Enter a clear, descriptive title"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the proposal"
              rows={4}
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Budget Breakdown</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Total: ${totalBudget.toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetItems.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Item {index + 1}</span>
                {budgetItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBudgetItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Budget item description"
                    value={item.description}
                    onChange={(e) => updateBudgetItem(item.id, 'description', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.amount || ''}
                    onChange={(e) => updateBudgetItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justification</Label>
                <Textarea
                  placeholder="Explain why this expense is necessary"
                  rows={2}
                  value={item.justification}
                  onChange={(e) => updateBudgetItem(item.id, 'justification', e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button onClick={addBudgetItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Budget Item
          </Button>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones & Deliverables</CardTitle>
          <CardDescription>Define clear milestones with payment schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Milestone {index + 1}</span>
                {milestones.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMilestone(milestone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Milestone title"
                    value={milestone.title}
                    onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={milestone.amount || ''}
                    onChange={(e) => updateMilestone(milestone.id, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Deliverables</Label>
                  <Textarea
                    placeholder="What will be delivered"
                    rows={2}
                    value={milestone.deliverables}
                    onChange={(e) => updateMilestone(milestone.id, 'deliverables', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={milestone.deadline}
                    onChange={(e) => updateMilestone(milestone.id, 'deadline', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addMilestone} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>

          {totalMilestoneAmount !== totalBudget && totalMilestoneAmount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-gray-900">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-900">
                Milestone total (${totalMilestoneAmount.toLocaleString()}) doesn't match budget total (${totalBudget.toLocaleString()})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button>Submit Proposal</Button>
      </div>
    </div>
  );
};