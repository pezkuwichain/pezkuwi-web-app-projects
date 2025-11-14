import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, DollarSign, Code, Users, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface ProposalWizardProps {
  onComplete: (proposal: any) => void;
  onCancel: () => void;
}

const ProposalWizard: React.FC<ProposalWizardProps> = ({ onComplete, onCancel }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [proposalData, setProposalData] = useState({
    title: '',
    category: '',
    summary: '',
    description: '',
    motivation: '',
    specification: '',
    budget: '',
    timeline: '',
    milestones: [''],
    risks: '',
    team: '',
    impact: '',
    metrics: ''
  });

  const templates = [
    {
      id: 'treasury',
      name: t('proposals.templates.treasury'),
      icon: DollarSign,
      description: t('proposals.templates.treasuryDesc'),
      color: 'bg-green-500'
    },
    {
      id: 'technical',
      name: t('proposals.templates.technical'),
      icon: Code,
      description: t('proposals.templates.technicalDesc'),
      color: 'bg-blue-500'
    },
    {
      id: 'community',
      name: t('proposals.templates.community'),
      icon: Users,
      description: t('proposals.templates.communityDesc'),
      color: 'bg-purple-500'
    }
  ];

  const steps = [
    { id: 1, name: t('proposals.steps.template') },
    { id: 2, name: t('proposals.steps.basics') },
    { id: 3, name: t('proposals.steps.details') },
    { id: 4, name: t('proposals.steps.impact') },
    { id: 5, name: t('proposals.steps.review') }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onComplete({ ...proposalData, template: selectedTemplate });
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`text-sm font-medium ${
                step.id <= currentStep ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {step.name}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && t('proposals.wizard.selectTemplate')}
            {currentStep === 2 && t('proposals.wizard.enterBasics')}
            {currentStep === 3 && t('proposals.wizard.provideDetails')}
            {currentStep === 4 && t('proposals.wizard.defineImpact')}
            {currentStep === 5 && t('proposals.wizard.reviewSubmit')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-green-500 shadow-lg'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${template.color} flex items-center justify-center`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t('proposals.fields.title')}</Label>
                <Input
                  id="title"
                  value={proposalData.title}
                  onChange={(e) => setProposalData({...proposalData, title: e.target.value})}
                  placeholder={t('proposals.placeholders.title')}
                />
              </div>
              <div>
                <Label htmlFor="category">{t('proposals.fields.category')}</Label>
                <Select
                  value={proposalData.category}
                  onValueChange={(value) => setProposalData({...proposalData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('proposals.placeholders.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treasury">Treasury</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="summary">{t('proposals.fields.summary')}</Label>
                <Textarea
                  id="summary"
                  value={proposalData.summary}
                  onChange={(e) => setProposalData({...proposalData, summary: e.target.value})}
                  placeholder={t('proposals.placeholders.summary')}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Detailed Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">{t('proposals.fields.description')}</Label>
                <Textarea
                  id="description"
                  value={proposalData.description}
                  onChange={(e) => setProposalData({...proposalData, description: e.target.value})}
                  placeholder={t('proposals.placeholders.description')}
                  rows={4}
                />
              </div>
              {selectedTemplate === 'treasury' && (
                <div>
                  <Label htmlFor="budget">{t('proposals.fields.budget')}</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={proposalData.budget}
                    onChange={(e) => setProposalData({...proposalData, budget: e.target.value})}
                    placeholder="Amount in PZK"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="timeline">{t('proposals.fields.timeline')}</Label>
                <Input
                  id="timeline"
                  value={proposalData.timeline}
                  onChange={(e) => setProposalData({...proposalData, timeline: e.target.value})}
                  placeholder="e.g., 3 months"
                />
              </div>
              <div>
                <Label>{t('proposals.fields.milestones')}</Label>
                {proposalData.milestones.map((milestone, index) => (
                  <Input
                    key={index}
                    value={milestone}
                    onChange={(e) => {
                      const newMilestones = [...proposalData.milestones];
                      newMilestones[index] = e.target.value;
                      setProposalData({...proposalData, milestones: newMilestones});
                    }}
                    placeholder={`Milestone ${index + 1}`}
                    className="mb-2"
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProposalData({...proposalData, milestones: [...proposalData.milestones, '']})}
                >
                  Add Milestone
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Impact Assessment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="impact">{t('proposals.fields.impact')}</Label>
                <Textarea
                  id="impact"
                  value={proposalData.impact}
                  onChange={(e) => setProposalData({...proposalData, impact: e.target.value})}
                  placeholder={t('proposals.placeholders.impact')}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="metrics">{t('proposals.fields.metrics')}</Label>
                <Textarea
                  id="metrics"
                  value={proposalData.metrics}
                  onChange={(e) => setProposalData({...proposalData, metrics: e.target.value})}
                  placeholder={t('proposals.placeholders.metrics')}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="risks">{t('proposals.fields.risks')}</Label>
                <Textarea
                  id="risks"
                  value={proposalData.risks}
                  onChange={(e) => setProposalData({...proposalData, risks: e.target.value})}
                  placeholder={t('proposals.placeholders.risks')}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-gray-900">
                <Check className="w-4 h-4 text-gray-900" />
                <AlertDescription className="text-gray-900">
                  {t('proposals.wizard.readyToSubmit')}
                </AlertDescription>
              </Alert>
              <div className="border rounded-lg p-4 space-y-3">
                <div>
                  <span className="font-semibold">{t('proposals.fields.title')}:</span>
                  <p className="text-gray-700">{proposalData.title}</p>
                </div>
                <div>
                  <span className="font-semibold">{t('proposals.fields.category')}:</span>
                  <p className="text-gray-700">{proposalData.category}</p>
                </div>
                <div>
                  <span className="font-semibold">{t('proposals.fields.summary')}:</span>
                  <p className="text-gray-700">{proposalData.summary}</p>
                </div>
                {proposalData.budget && (
                  <div>
                    <span className="font-semibold">{t('proposals.fields.budget')}:</span>
                    <p className="text-gray-700">{proposalData.budget} PZK</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handleBack}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? t('common.cancel') : t('common.back')}
            </Button>
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedTemplate}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('common.next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {t('common.submit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalWizard;