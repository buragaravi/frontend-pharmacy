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

  // Helper to determine if chat mode should be used (admin <-> central_lab_admin)
  const isChatMode = userRole === 'admin' || userRole === 'central_lab_admin';

  // Helper to get display name for role
  const getDisplayName = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'central_lab_admin') return 'Central Lab Admin';
    if (role === 'lab_assistant') return 'Lab Assistant';
    return role;
  };

  // Helper to determine message alignment (right for current user, left for other)
  const getMessageAlign = (role) => {
    if (userRole === role) return 'justify-end';
    return 'justify-start';
  };

  // Helper to determine bubble color
  const getBubbleColor = (role) => {
    if (role === 'admin') return 'bg-[#E1F1FF] text-[#0B3861]';
    if (role === 'central_lab_admin') return 'bg-[#F9F3F7] text-[#6D123F]';
    return 'bg-gray-100 text-gray-700';
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
    if (userRole === 'central_lab_admin' && createdByRole === 'lab_assistant') return true;
    if (userRole === 'admin' && createdByRole === 'central_lab_admin') return true;
    if (userRole === 'lab_assistant' && createdByRole === 'lab_assistant') return true;
    if (userRole === 'central_lab_admin' && createdByRole === 'central_lab_admin') return true;
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
    <div className="mt-6 border-t border-[#E8D8E1] pt-4">
      <div className="flex items-center mb-4">
        <CommentIcon className="text-[#6D123F] mr-2" />
        <h4 className="font-semibold text-[#6D123F]">Comments</h4>
      </div>
      {fetching ? (
        <div className="bg-[#F9F3F7] p-4 rounded-lg mb-4 text-[#9C4668] italic">Loading comments...</div>
      ) : comments.length > 0 ? (
        <div className="p-2 rounded-lg mb-4 max-h-60 overflow-y-auto flex flex-col gap-2">
          {isChatMode ? (
            getUniqueComments(comments).map((c, i) => (
              <div key={i} className={`flex ${getMessageAlign(c.role)}`}> 
                <div className={`rounded-xl px-4 py-2 shadow-sm ${getBubbleColor(c.role)} max-w-[70%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs">{getDisplayName(c.role)}</span>
                    <span className="text-[10px] text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <div className="whitespace-pre-line text-sm">{c.text}</div>
                </div>
              </div>
            ))
          ) : (
            getUniqueComments(comments).map((c, i) => (
              <div key={i} className="mb-2">
                <span className="font-semibold text-[#6D123F]">{getDisplayName(c.role)}</span>
                <span className="mx-2 text-xs text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                <div className="text-[#6D123F]">{c.text}</div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-[#F9F3F7] p-4 rounded-lg mb-4">
          <p className="text-[#9C4668] italic">No comments yet</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
      )}
      {canAddComment() && (
        <div className="sticky bottom-0 left-0 right-0 bg-white z-10 flex gap-2 mt-2 py-2 px-1 rounded-xl shadow-md border border-[#E8D8E1]">
          <textarea
            rows="1"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-[#E8D8E1] focus:outline-none focus:ring-2 focus:ring-[#6D123F] text-[#6D123F] bg-white resize-none shadow-sm"
            disabled={isLoading}
            style={{ minHeight: 36, maxHeight: 80, fontSize: 15, marginRight: 8 }}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isLoading}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors shadow ${
              newComment.trim() && !isLoading
                ? 'bg-[#6D123F] text-white hover:bg-[#5A0F33]'
                : 'bg-[#F5EBF1] text-[#9C4668] cursor-not-allowed'
            }`}
            title="Send"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;