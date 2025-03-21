"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import useCurrentUser from "@/hooks/useCurrentUser";
import useUserRoles from "@/hooks/useUserRoles";

// Fetch comments for a task
const fetchComments = async (taskId) => {
  const response = await fetch(`/api/tasks/${taskId}/comments`);
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  return response.json();
};

// Add a comment
const addComment = async ({ taskId, content }) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Add the token
    },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add comment");
  }
  return response.json();
};

// Delete a comment
const deleteComment = async ({ taskId, commentId }) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}` // Add the token
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete comment");
  }
  return response.json();
};

export default function TaskComments({ taskId, readOnly = false }) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const { isEngineer, canManageTasks } = useUserRoles();

  // Check if user can add comments
  const canAddComments = !readOnly && canManageTasks();
  
  // Check if user can delete comments
  const canDeleteComment = (comment) => {
    if (readOnly) return false;
    if (!currentUser) return false;
    
    // Engineers can delete any comment
    if (isEngineer()) return true;
    
    // Users can delete their own comments
    return comment.user?._id === currentUser._id;
  };

  // Fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["taskComments", taskId],
    queryFn: () => fetchComments(taskId),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: addComment,
    onSuccess: () => {
      queryClient.invalidateQueries(["taskComments", taskId]);
      setNewComment("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast.error(`Error adding comment: ${error.message}`);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries(["taskComments", taskId]);
      toast.success("Comment deleted");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error(`Error deleting comment: ${error.message}`);
    },
  });

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!currentUser) {
      toast.error("You must be logged in to add comments");
      return;
    }
    
    if (!canAddComments) {
      toast.error("You don't have permission to add comments");
      return;
    }
    
    addCommentMutation.mutate({
      taskId,
      content: newComment,
    });
  };

  const handleDeleteComment = (commentId) => {
    if (!currentUser) {
      toast.error("You must be logged in to delete comments");
      return;
    }
    
    // Find the comment to check permissions
    const comment = comments.find(c => c._id === commentId);
    if (!comment) return;
    
    if (!canDeleteComment(comment)) {
      toast.error("You don't have permission to delete this comment");
      return;
    }
    
    deleteCommentMutation.mutate({
      taskId,
      commentId,
    });
  };

  if (isLoading) {
    return <CommentsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Error loading comments: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Comments</h3>
      
      {/* Add comment form - only visible if not in read-only mode */}
      {canAddComments && (
        <form onSubmit={handleAddComment} className="flex gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none min-h-[60px]"
          />
          <Button 
            type="submit" 
            className="px-3" 
            disabled={addCommentMutation.isLoading || !newComment.trim()}
          >
            {addCommentMutation.isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
      
      {/* Comments list */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div 
              key={comment._id} 
              className="flex gap-4 p-4 rounded-lg bg-card border border-border"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.user?.image} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {comment.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-default-900">
                      {comment.user?.name || "Unknown User"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {canDeleteComment(comment) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteComment(comment._id)}
                      disabled={deleteCommentMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm text-default-800 whitespace-pre-line">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">No comments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Comments</h3>
      
      <div className="flex gap-3">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-10 w-10 self-end" />
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 