import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, ExternalLink, Play } from 'lucide-react';
import { usePolkadot } from '@/contexts/PolkadotContext';
import { toast } from 'sonner';
import { LoadingState } from '@shared/components/AsyncComponent';
import { getCourses, enrollInCourse, type Course } from '@shared/lib/perwerde';
import { getIPFSUrl } from '@shared/lib/ipfs';

interface CourseListProps {
  enrolledCourseIds: number[];
  onEnroll: () => void;
}

export function CourseList({ enrolledCourseIds, onEnroll }: CourseListProps) {
  const { api, selectedAccount } = usePolkadot();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const activeCourses = await getCourses('Active');
        setCourses(activeCourses);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to fetch courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch courses',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    if (!api || !selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await enrollInCourse(api, selectedAccount, courseId);
      onEnroll();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Enroll failed:', error);
    }
  };

  if (loading) {
    return <LoadingState message="Loading available courses..." />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        {courses.length > 0 ? `Available Courses (${courses.length})` : 'No Courses Available'}
      </h2>

      {courses.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Active Courses</h3>
            <p className="text-gray-500 mb-6">
              Check back later for new educational content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => {
            const isUserEnrolled = enrolledCourseIds.includes(course.id);

            return (
              <Card
                key={course.id}
                className="bg-gray-900 border-gray-800 hover:border-green-500/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{course.name}</h3>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                          #{course.id}
                        </Badge>
                        {isUserEnrolled && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            Enrolled
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-400 mb-4">{course.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {course.owner.slice(0, 8)}...{course.owner.slice(-6)}
                        </div>
                        {course.content_link && (
                          <a
                            href={getIPFSUrl(course.content_link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-400 hover:text-green-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Course Materials
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isUserEnrolled ? (
                        <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                          <Play className="w-4 h-4 mr-2" />
                          Already Enrolled
                        </Button>
                      ) : (
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleEnroll(course.id)}
                          disabled={!selectedAccount}
                        >
                          Enroll Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
