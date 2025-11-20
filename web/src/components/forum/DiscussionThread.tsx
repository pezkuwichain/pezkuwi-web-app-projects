import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, MessageSquare, Shield, MoreVertical, Flag, Edit, Trash2 } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  isExpert: boolean;
  badges: string[];
  replies: Comment[];
  sentiment: 'positive' | 'neutral' | 'negative';
  userVote?: 'up' | 'down' | null;
  isLive?: boolean;
}

export function DiscussionThread({ proposalId }: { proposalId: string }) {
  const { toast } = useToast();
  const { subscribe, unsubscribe, sendMessage, isConnected } = useWebSocket();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Dr. Rojin Ahmed',
      avatar: '/api/placeholder/40/40',
      content: '## Strong Support for This Proposal\n\nThis proposal addresses a critical need in our governance system. The implementation timeline is realistic and the budget allocation seems appropriate.\n\n**Key Benefits:**\n- Improved transparency\n- Better community engagement\n- Clear accountability metrics\n\nI particularly appreciate the phased approach outlined in section 3.',
      timestamp: '2 hours ago',
      upvotes: 24,
      downvotes: 2,
      isExpert: true,
      badges: ['Governance Expert', 'Top Contributor'],
      sentiment: 'positive',
      userVote: null,
      replies: [
        {
          id: '1-1',
          author: 'Kawa Mustafa',
          avatar: '/api/placeholder/40/40',
          content: 'Agreed! The phased approach reduces risk significantly.',
          timestamp: '1 hour ago',
          upvotes: 8,
          downvotes: 0,
          isExpert: false,
          badges: ['Active Member'],
          sentiment: 'positive',
          userVote: null,
          replies: []
        }
      ]
    },
    {
      id: '2',
      author: 'Dilan Karim',
      avatar: '/api/placeholder/40/40',
      content: '### Concerns About Implementation\n\nWhile I support the overall direction, I have concerns about:\n\n1. The technical complexity might be underestimated\n2. We need more details on the security audit process\n3. Reference to [Proposal #142](/proposals/142) shows similar challenges\n\n> "The devil is in the details" - and we need more of them',
      timestamp: '3 hours ago',
      upvotes: 18,
      downvotes: 5,
      isExpert: true,
      badges: ['Security Expert'],
      sentiment: 'negative',
      userVote: null,
      replies: []
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  // WebSocket subscriptions for real-time updates
  useEffect(() => {
    const handleNewComment = (data: Record<string, unknown>) => {
      const newComment: Comment = {
        ...data,
        isLive: true,
      };
      setComments(prev => [newComment, ...prev]);
      
      // Show notification for mentions
      if (data.content.includes('@currentUser')) {
        toast({
          title: "You were mentioned",
          description: `${data.author} mentioned you in a comment`,
        });
      }
    };

    const handleVoteUpdate = (data: { commentId: string; upvotes: number; downvotes: number }) => {
      setComments(prev => updateVoteCounts(prev, data.commentId, data.upvotes, data.downvotes));
    };

    const handleSentimentUpdate = (data: { proposalId: string; sentiment: Record<string, unknown> }) => {
      if (data.proposalId === proposalId) {
        // Update sentiment visualization in parent component
        if (import.meta.env.DEV) console.log('Sentiment updated:', data.sentiment);
      }
    };

    subscribe('comment', handleNewComment);
    subscribe('vote', handleVoteUpdate);
    subscribe('sentiment', handleSentimentUpdate);

    return () => {
      unsubscribe('comment', handleNewComment);
      unsubscribe('vote', handleVoteUpdate);
      unsubscribe('sentiment', handleSentimentUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, unsubscribe, proposalId, toast]);
     

  const updateVoteCounts = (comments: Comment[], targetId: string, upvotes: number, downvotes: number): Comment[] => {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return { ...comment, upvotes, downvotes };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateVoteCounts(comment.replies, targetId, upvotes, downvotes)
        };
      }
      return comment;
    });
  };

  const handleVote = useCallback((commentId: string, voteType: 'up' | 'down') => {
    const updatedComments = updateCommentVote(comments, commentId, voteType);
    setComments(updatedComments);
    
    // Send vote update via WebSocket
    const comment = findComment(updatedComments, commentId);
    if (comment && isConnected) {
      sendMessage({
        type: 'vote',
        data: {
          commentId,
          upvotes: comment.upvotes,
          downvotes: comment.downvotes,
          proposalId,
        },
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, isConnected, sendMessage, proposalId]);

  const findComment = (comments: Comment[], targetId: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === targetId) return comment;
      const found = findComment(comment.replies, targetId);
      if (found) return found;
    }
    return null;
  };

  const updateCommentVote = (comments: Comment[], targetId: string, voteType: 'up' | 'down'): Comment[] => {
    return comments.map(comment => {
      if (comment.id === targetId) {
        const wasUpvoted = comment.userVote === 'up';
        const wasDownvoted = comment.userVote === 'down';
        
        if (voteType === 'up') {
          return {
            ...comment,
            upvotes: wasUpvoted ? comment.upvotes - 1 : comment.upvotes + 1,
            downvotes: wasDownvoted ? comment.downvotes - 1 : comment.downvotes,
            userVote: wasUpvoted ? null : 'up'
          };
        } else {
          return {
            ...comment,
            upvotes: wasUpvoted ? comment.upvotes - 1 : comment.upvotes,
            downvotes: wasDownvoted ? comment.downvotes - 1 : comment.downvotes + 1,
            userVote: wasDownvoted ? null : 'down'
          };
        }
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentVote(comment.replies, targetId, voteType)
        };
      }
      return comment;
    });
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-12 mt-4' : 'mb-6'} ${comment.isLive ? 'animate-pulse-once' : ''}`}>
      <Card className="border-l-4 transition-all duration-300" style={{
        borderLeftColor: comment.sentiment === 'positive' ? '#10b981' : 
                        comment.sentiment === 'negative' ? '#ef4444' : '#6b7280'
      }}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Avatar className="relative">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback>{comment.author[0]}</AvatarFallback>
                {comment.isLive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{comment.author}</span>
                  {comment.isExpert && (
                    <Shield className="h-4 w-4 text-blue-500" />
                  )}
                  {comment.badges.map(badge => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                  <span className="text-sm text-gray-500">
                    {comment.isLive ? 'Just now' : comment.timestamp}
                  </span>
                  {isConnected && (
                    <div className="h-2 w-2 bg-green-500 rounded-full" title="Real-time updates active" />
                  )}
                </div>
                <div className="mt-3 prose prose-sm max-w-none" 
                     dangerouslySetInnerHTML={{ __html: parseMarkdown(comment.content) }} />
                <div className="flex items-center space-x-4 mt-4">
                  <Button
                    variant={comment.userVote === 'up' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleVote(comment.id, 'up')}
                    className="transition-all duration-200"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="transition-all duration-300">{comment.upvotes}</span>
                  </Button>
                  <Button
                    variant={comment.userVote === 'down' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleVote(comment.id, 'down')}
                    className="transition-all duration-200"
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    <span className="transition-all duration-300">{comment.downvotes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {replyTo === comment.id && (
            <div className="mt-4">
              <Textarea
                placeholder="Write your reply... @mention users to notify them"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button variant="outline" onClick={() => setReplyTo(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (newComment.trim() && isConnected) {
                      sendMessage({
                        type: 'reply',
                        data: {
                          parentId: comment.id,
                          content: newComment,
                          proposalId,
                          author: 'Current User',
                        },
                        timestamp: Date.now(),
                      });
                    }
                    setReplyTo(null);
                    setNewComment('');
                  }}
                  disabled={!newComment.trim()}
                >
                  Post Reply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {comment.replies.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  const parseMarkdown = (text: string): string => {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Discussion Forum</h3>
          <p className="text-sm text-gray-600">Share your thoughts and feedback on this proposal</p>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your comment... (Markdown supported)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
            >
              Markdown Help
            </Button>
            <Button>Post Comment</Button>
          </div>
          {showMarkdownHelp && (
            <Card className="mt-4 p-4 bg-gray-50 text-gray-900">
              <p className="text-sm font-semibold mb-2 text-gray-900">Markdown Formatting:</p>
              <ul className="text-sm space-y-1 text-gray-900">
                <li>**bold** → <strong>bold</strong></li>
                <li>*italic* → <em>italic</em></li>
                <li>[link](url) → <a href="#" className="text-blue-600">link</a></li>
                <li>&gt; quote → <blockquote className="border-l-4 border-gray-300 pl-2">quote</blockquote></li>
                <li># Heading → <span className="font-bold text-lg">Heading</span></li>
              </ul>
            </Card>
          )}
        </CardContent>
      </Card>

      <div>
        {comments.map(comment => renderComment(comment))}
      </div>
    </div>
  );
}