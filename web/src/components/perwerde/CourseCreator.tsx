import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from 'sonner';
import { createCourse } from '@shared/lib/perwerde';
import { uploadToIPFS } from '@shared/lib/ipfs';
import { Loader2 } from 'lucide-react';

interface CourseCreatorProps {
  onCourseCreated: () => void;
}

export function CourseCreator({ onCourseCreated }: CourseCreatorProps) {
  const { api, selectedAccount } = usePolkadot();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!api || !selectedAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!name || !description || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload content to IPFS
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], 'course-content.md', { type: 'text/markdown' });
      
      let ipfsHash: string;
      try {
        ipfsHash = await uploadToIPFS(file);
        toast.success(`Content uploaded: ${ipfsHash.slice(0, 10)}...`);
      } catch {
        toast.error('IPFS upload failed');
        return; // STOP - don&apos;t call blockchain
      }

      // 2. Create course on blockchain
      await createCourse(api, selectedAccount, name, description, ipfsHash);

      // 3. Reset form
      onCourseCreated();
      setName('');
      setDescription('');
      setContent('');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to create course:', error);
      // toast already shown in createCourse()
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Create New Course</CardTitle>
        <CardDescription>Fill in the details to create a new course on the Perwerde platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Course Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Introduction to Blockchain"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">Course Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief summary of the course content and objectives."
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content" className="text-white">Course Content (Markdown)</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your course material here using Markdown..."
            className="bg-gray-800 border-gray-700 text-white h-48"
          />
        </div>
        <Button
          onClick={handleCreateCourse}
          disabled={loading || !selectedAccount}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Course'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
