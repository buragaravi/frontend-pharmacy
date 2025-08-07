import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// SVG Icons
const CommentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CommentSection = ({ quotationId, comments: propComments, createdByRole, status, onStatusUpdate, onCommentAdded }) => {
  const [comments, setComments] = useState(propComments || []);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(!propComments);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token).user : null;
  const userRole = user?.role;

  // Helper to extract comments from any backend response shape
  const extractComments = (data) => {
    if (Array.isArray(data?.comments)) return data.comments;
    if (Array.isArray(data?.quotation?.comments)) return data.quotation.comments;
    return [];
  };

  // Helper to determine if chat mode should be used (admin <-> central_store_admin)
  const isChatMode = userRole === 'admin' || userRole === 'central_store_admin';

  // Helper to get display name for role
  const getDisplayName = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'central_store_admin') return 'Central Store';
    if (role === 'lab_assistant') return 'Lab Assistant';
    return role;
  };

  // Helper to determine message alignment (right for current user, left for other)
  const getMessageAlign = (role) => {
    if (userRole === role) return 'justify-end';
    return 'justify-start';
  };

  // Helper to determine bubble color with vibrant blue theme
  const getBubbleColor = (role) => {
    if (userRole === role) {
      // Current user - vibrant blue
      return 'bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white';
    } else {
      // Other users - light blue/white
      if (role === 'admin') return 'bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] text-[#1976D2] border border-[#2196F3]/20';
      if (role === 'central_store_admin') return 'bg-gradient-to-r from-[#F3E5F5] to-[#E1BEE7] text-[#7B1FA2] border border-[#9C27B0]/20';
      return 'bg-gradient-to-r from-[#F5F5F5] to-[#E0E0E0] text-[#424242] border border-gray-300';
    }
  };

  // Filter out redundant comments (same text, case-insensitive, trimmed), keep only the first occurrence
  const getUniqueComments = (commentsArr) => {
    const seen = new Set();
    return commentsArr.filter((c) => {
      const key = (c.text || '').trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // If comments are passed as prop, update state when prop changes
  useEffect(() => {
    if (propComments) {
      setComments(propComments);
      setFetching(false);
    }
  }, [propComments]);

  // Only fetch from backend if no propComments
  useEffect(() => {
    if (propComments) return;
    const fetchComments = async () => {
      setFetching(true);
      setError('');
      try {
        const res = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/quotations/${quotationId}`);
        setComments(extractComments(res.data));
      } catch (err) {
        setComments([]);
        setError('Failed to fetch comments');
      } finally {
        setFetching(false);
      }
    };
    fetchComments();
  }, [quotationId, propComments]);

  const canAddComment = () => {
    if (userRole === 'central_store_admin' && createdByRole === 'lab_assistant') return true;
    if (userRole === 'admin' && createdByRole === 'central_store_admin') return true;
    if (userRole === 'lab_assistant' && createdByRole === 'lab_assistant') return true;
    if (userRole === 'central_store_admin' && createdByRole === 'central_store_admin') return true;
    return false;
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotationId}/comments`,
        { text: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      // Instead of refetching here, notify parent to refresh
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-6 border-t border-[#E3F2FD] pt-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-xl text-white mr-3">
          <CommentIcon />
        </div>
        <h4 className="font-semibold text-[#1976D2] text-lg">Discussion</h4>
      </div>
      
      {fetching ? (
        <div className="bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] p-4 rounded-2xl mb-4 text-[#1976D2] italic flex items-center">
          <div className="w-5 h-5 border-2 border-[#2196F3] border-t-transparent rounded-full animate-spin mr-3" />
          Loading conversation...
        </div>
      ) : comments.length > 0 ? (
        <div className="bg-gradient-to-b from-[#F3F9FF] to-[#E8F4FD] p-4 rounded-2xl mb-4 max-h-64 overflow-y-auto space-y-3 custom-scrollbar">
          {isChatMode ? (
            getUniqueComments(comments).map((c, i) => (
              <div key={i} className={`flex ${getMessageAlign(c.role)} animate-fadeIn`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${getBubbleColor(c.role)}`}>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-medium opacity-80">
                      {getDisplayName(c.role)}
                    </span>
                    <span className="text-xs opacity-60 ml-2">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          ) : (
            getUniqueComments(comments).map((c, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm border border-[#E3F2FD] rounded-xl p-3 hover:bg-white/90 transition-all duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-[#2196F3] bg-[#E3F2FD] px-2 py-1 rounded-full">
                    {getDisplayName(c.role)}
                  </span>
                  <span className="text-xs text-[#1976D2] opacity-70">
                    {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-[#1976D2] leading-relaxed">{c.text}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#E3F2FD] to-[#BBDEFB] p-6 rounded-2xl mb-4 text-center">
          <CommentIcon className="w-8 h-8 text-[#2196F3] mx-auto mb-2 opacity-60" />
          <p className="text-[#1976D2] text-sm font-medium">No comments yet</p>
          <p className="text-[#2196F3] text-xs mt-1">Start the conversation below</p>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {canAddComment() && (
        <div className="relative">
          <div className="flex items-end space-x-3 bg-gradient-to-r from-[#F3F9FF] to-[#E8F4FD] p-4 rounded-2xl border border-[#E3F2FD]">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isChatMode ? "Type your message..." : "Add a comment..."}
                className="w-full px-4 py-3 text-sm border border-[#E3F2FD] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-transparent bg-white/90 backdrop-blur-sm transition-all duration-200"
                rows="2"
                disabled={isLoading}
              />
              <p className="text-xs text-[#2196F3] mt-1 opacity-70">Press Enter to send, Shift+Enter for new line</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !newComment.trim()}
              className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white p-3 rounded-xl hover:from-[#1976D2] hover:to-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;