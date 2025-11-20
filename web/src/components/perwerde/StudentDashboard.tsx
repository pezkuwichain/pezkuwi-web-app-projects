import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Award } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from 'sonner';
import { LoadingState } from '@shared/components/AsyncComponent';
import { completeCourse, type Enrollment } from '@shared/lib/perwerde';

interface StudentDashboardProps {
  enrollments: Enrollment[];
  loading: boolean;
  onCourseCompleted: () => void;
}

export function StudentDashboard({ enrollments, loading, onCourseCompleted }: StudentDashboardProps) {
  const { api, selectedAccount } = usePolkadot();

  const handleComplete = async (courseId: number) => {
    if (!api || !selectedAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // For now, let&apos;s assume a fixed number of points for completion
      const points = 10;
      await completeCourse(api, selectedAccount, courseId, points);
      onCourseCompleted();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to complete course:', error);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  const completedCourses = enrollments.filter(e => e.is_completed).length;
  const totalPoints = enrollments.reduce((sum, e) => sum + e.points_earned, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{enrollments.length}</div>
                <div className="text-sm text-gray-400">Enrolled Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{completedCourses}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalPoints}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-gray-400">You are not enrolled in any courses yet.</p>
          ) : (
            <div className="space-y-4">
              {enrollments.map(enrollment => (
                <div key={enrollment.id} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Course #{enrollment.course_id}</h4>
                      <p className="text-sm text-gray-400">
                        Enrolled on: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {enrollment.is_completed ? (
                        <Badge className="bg-green-500/10 text-green-400">Completed</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleComplete(enrollment.course_id)}>
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
