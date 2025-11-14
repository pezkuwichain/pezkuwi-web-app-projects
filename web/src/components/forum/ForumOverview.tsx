import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, MessageSquare, Users, BarChart3, Search, Filter, Clock, Flame, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DiscussionThread } from './DiscussionThread';

interface Discussion {
  id: string;
  title: string;
  proposalId: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
  sentiment: number;
  trending: boolean;
  pinned: boolean;
  tags: string[];
}

export function ForumOverview() {
  const { t } = useTranslation();
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterCategory, setFilterCategory] = useState('all');

  const discussions: Discussion[] = [
    {
      id: '1',
      title: 'Treasury Allocation for Developer Grants - Q1 2024',
      proposalId: 'prop-001',
      author: 'Dr. Rojin Ahmed',
      category: 'Treasury',
      replies: 45,
      views: 1234,
      lastActivity: '2 hours ago',
      sentiment: 72,
      trending: true,
      pinned: true,
      tags: ['treasury', 'grants', 'development']
    },
    {
      id: '2',
      title: 'Technical Upgrade: Implementing Zero-Knowledge Proofs',
      proposalId: 'prop-002',
      author: 'Kawa Mustafa',
      category: 'Technical',
      replies: 28,
      views: 890,
      lastActivity: '5 hours ago',
      sentiment: 85,
      trending: true,
      pinned: false,
      tags: ['technical', 'zkp', 'privacy']
    },
    {
      id: '3',
      title: 'Community Initiative: Education Program for New Users',
      proposalId: 'prop-003',
      author: 'Dilan Karim',
      category: 'Community',
      replies: 62,
      views: 2100,
      lastActivity: '1 day ago',
      sentiment: 45,
      trending: false,
      pinned: false,
      tags: ['community', 'education', 'onboarding']
    }
  ];

  const sentimentStats = {
    positive: 42,
    neutral: 35,
    negative: 23
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'text-green-600';
    if (sentiment >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 70) return <TrendingUp className="h-4 w-4" />;
    if (sentiment >= 40) return <BarChart3 className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  if (selectedDiscussion) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedDiscussion(null)}
        >
          ← Back to Forum
        </Button>
        <DiscussionThread proposalId={selectedDiscussion} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Community Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Positive</span>
                <span className="text-sm text-green-600">{sentimentStats.positive}%</span>
              </div>
              <Progress value={sentimentStats.positive} className="h-2 bg-green-100" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Neutral</span>
                <span className="text-sm text-yellow-600">{sentimentStats.neutral}%</span>
              </div>
              <Progress value={sentimentStats.neutral} className="h-2 bg-yellow-100" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Negative</span>
                <span className="text-sm text-red-600">{sentimentStats.negative}%</span>
              </div>
              <Progress value={sentimentStats.negative} className="h-2 bg-red-100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="treasury">Treasury</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
                <SelectItem value="sentiment">Best Sentiment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card 
            key={discussion.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedDiscussion(discussion.proposalId)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {discussion.pinned && (
                      <Badge variant="secondary">
                        📌 Pinned
                      </Badge>
                    )}
                    {discussion.trending && (
                      <Badge variant="destructive">
                        <Flame className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge variant="outline">{discussion.category}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{discussion.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>by {discussion.author}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {discussion.replies} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {discussion.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {discussion.lastActivity}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {discussion.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-center ml-6">
                  <div className={`text-2xl font-bold ${getSentimentColor(discussion.sentiment)}`}>
                    {discussion.sentiment}%
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    {getSentimentIcon(discussion.sentiment)}
                    <span>Sentiment</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}