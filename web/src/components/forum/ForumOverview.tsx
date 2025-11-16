import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@pezkuwi/components/AsyncComponent';
import {
  MessageSquare,
  Users,
  Search,
  Filter,
  Clock,
  Flame,
  Pin,
  Lock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForum } from '@/hooks/useForum';
import { DiscussionThread } from './DiscussionThread';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export function ForumOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { announcements, categories, discussions, loading, error, reactToDiscussion } = useForum();
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterCategory, setFilterCategory] = useState('all');

  const getAnnouncementStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          bgClass: 'bg-red-500/10 border-red-500/20'
        };
      case 'warning':
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          bgClass: 'bg-yellow-500/10 border-yellow-500/20'
        };
      case 'success':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          bgClass: 'bg-green-500/10 border-green-500/20'
        };
      default:
        return {
          variant: 'default' as const,
          icon: Info,
          bgClass: 'bg-blue-500/10 border-blue-500/20'
        };
    }
  };

  const filteredDiscussions = discussions
    .filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || d.category?.name.toLowerCase() === filterCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.upvotes || 0) - (a.upvotes || 0);
        case 'replies':
          return b.replies_count - a.replies_count;
        case 'views':
          return b.views_count - a.views_count;
        default:
          return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
      }
    });

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

  if (loading) {
    return <LoadingState message="Loading forum..." />;
  }

  return (
    <div className="space-y-6">
      {/* Admin Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const style = getAnnouncementStyle(announcement.type);
            const Icon = style.icon;

            return (
              <Alert key={announcement.id} className={style.bgClass}>
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <AlertTitle className="text-lg font-semibold mb-2">
                      {announcement.title}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {announcement.content}
                    </AlertDescription>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Posted {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Forum Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discussions</p>
                <p className="text-2xl font-bold">{discussions.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {new Set(discussions.map(d => d.author_id)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Replies</p>
                <p className="text-2xl font-bold">
                  {discussions.reduce((sum, d) => sum + d.replies_count, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filters & Actions */}
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
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
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
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
            {user && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => setFilterCategory(category.name.toLowerCase())}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-2">{category.icon}</div>
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {discussions.filter(d => d.category?.id === category.id).length} discussions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No discussions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDiscussions.map((discussion) => (
            <Card
              key={discussion.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDiscussion(discussion.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {discussion.is_pinned && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {discussion.is_locked && (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-700 border-red-500/20">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                      {discussion.category && (
                        <Badge variant="outline">
                          {discussion.category.icon} {discussion.category.name}
                        </Badge>
                      )}
                      {(discussion.upvotes || 0) > 10 && (
                        <Badge variant="destructive">
                          <Flame className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                      {discussion.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>by {discussion.author_name}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.replies_count} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {discussion.views_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(discussion.last_activity_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Tags */}
                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {discussion.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voting */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        reactToDiscussion(discussion.id, 'upvote');
                      }}
                      className="hover:text-green-500"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold">
                      {(discussion.upvotes || 0) - (discussion.downvotes || 0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        reactToDiscussion(discussion.id, 'downvote');
                      }}
                      className="hover:text-red-500"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
