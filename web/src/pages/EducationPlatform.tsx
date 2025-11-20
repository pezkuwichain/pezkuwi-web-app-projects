import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseList } from '@/components/perwerde/CourseList';
import { StudentDashboard } from '@/components/perwerde/StudentDashboard';
import { CourseCreator } from '@/components/perwerde/CourseCreator';
import { getStudentEnrollments, type Enrollment } from '@shared/lib/perwerde';
import { toast } from 'sonner';
// import { AsyncComponent, LoadingState } from '@shared/components/AsyncComponent';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function EducationPlatform() {
  const { user } = useAuth();
  const { selectedAccount } = usePolkadot();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const fetchEnrollments = useCallback(async () => {
    if (!selectedAccount) {
      setEnrollments([]);
      return;
    }
    try {
      setLoading(true);
      const studentEnrollments = await getStudentEnrollments(selectedAccount.address);
      setEnrollments(studentEnrollments);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch enrollments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your enrollments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleDataChange = () => {
    // Refetch enrollments after an action
    fetchEnrollments();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-green-500" />
            Perwerde - Education Platform
          </h1>
          <p className="text-gray-400">
            Decentralized learning for Digital Kurdistan. Build skills, earn credentials, empower our nation.
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="bg-gray-700 hover:bg-gray-600 text-white">
          ← Back to Home
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Available Courses</TabsTrigger>
          {selectedAccount && <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>}
          {isAdmin && <TabsTrigger value="create">Create Course</TabsTrigger>}
        </TabsList>

        <TabsContent value="courses">
          <CourseList
            enrolledCourseIds={enrollments.map(e => e.course_id)}
            onEnroll={handleDataChange}
          />
        </TabsContent>

        {selectedAccount && (
          <TabsContent value="dashboard">
            <StudentDashboard
              enrollments={enrollments}
              loading={loading}
              onCourseCompleted={handleDataChange}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="create">
            <CourseCreator onCourseCreated={() => {
              handleDataChange();
              setActiveTab('courses'); // Switch back to course list after creation
            }} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
