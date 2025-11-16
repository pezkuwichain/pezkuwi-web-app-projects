/**
 * Perwerde Education Platform
 *
 * Decentralized education system for Digital Kurdistan
 * - Browse courses
 * - Enroll in courses
 * - Track learning progress
 * - Earn educational credentials
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
} from 'lucide-react';

export default function EducationPlatform() {
  // Mock data - will be replaced with blockchain integration
  const courses = [
    {
      id: 1,
      title: 'Kurdish Language & Literature',
      instructor: 'Prof. Hêmin Xelîl',
      students: 1247,
      rating: 4.8,
      duration: '8 weeks',
      level: 'Beginner',
      status: 'Active',
    },
    {
      id: 2,
      title: 'Blockchain Technology Fundamentals',
      instructor: 'Dr. Sara Hasan',
      students: 856,
      rating: 4.9,
      duration: '6 weeks',
      level: 'Intermediate',
      status: 'Active',
    },
    {
      id: 3,
      title: 'Kurdish History & Culture',
      instructor: 'Prof. Azad Muhammed',
      students: 2103,
      rating: 4.7,
      duration: '10 weeks',
      level: 'Beginner',
      status: 'Active',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-green-500" />
          Perwerde - Education Platform
        </h1>
        <p className="text-gray-400">
          Decentralized learning for Digital Kurdistan. Build skills, earn credentials, empower our nation.
        </p>
      </div>

      {/* Integration Notice */}
      <Alert className="mb-8 bg-yellow-900/20 border-yellow-500/30">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <strong>Blockchain Integration In Progress:</strong> This platform will connect to the Perwerde pallet
          for decentralized course management, credential issuance, and educator rewards. Current data is for
          demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">127</div>
                <div className="text-sm text-gray-400">Active Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">12.4K</div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">342</div>
                <div className="text-sm text-gray-400">Instructors</div>
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
                <div className="text-2xl font-bold text-white">8.9K</div>
                <div className="text-sm text-gray-400">Certificates Issued</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Featured Courses</h2>
          <Button className="bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>

        <div className="grid gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="bg-gray-900 border-gray-800 hover:border-green-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Course Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{course.title}</h3>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                        {course.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {course.instructor}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.students.toLocaleString()} students
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-white font-bold">{course.rating}</span>
                        <span className="text-gray-400 text-sm">(4.8/5.0)</span>
                      </div>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Enroll Now
                    </Button>
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Learning Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">My Learning Progress</h2>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Courses Enrolled Yet</h3>
            <p className="text-gray-500 mb-6">
              Start your learning journey! Enroll in courses to track your progress and earn credentials.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              Browse All Courses
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Features Notice */}
      <Card className="mt-8 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Upcoming Blockchain Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-4 text-sm">
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Decentralized course creation & hosting
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              NFT-based certificates & credentials
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Educator rewards in HEZ tokens
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Peer review & quality assurance
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Skill-based Tiki role assignments
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Decentralized governance for education
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
