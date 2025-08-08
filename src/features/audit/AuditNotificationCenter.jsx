import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AuditNotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { type: 'audit' }
      });
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching audit notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`https://backend-pharmacy-5541.onrender.com/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('https://backend-pharmacy-5541.onrender.com/api/notifications/mark-all-read', 
        { type: 'audit' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'urgent':
        return notifications.filter(n => n.priority === 'urgent');
      default:
        return notifications;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Audit Notifications</h2>
              <p className="text-blue-100 mt-1">
                {notifications.filter(n => !n.read).length} unread notifications
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['all', 'unread', 'read', 'urgent'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>
            
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h5v14z" />
                </svg>
              </div>
              <p className="text-gray-500">No notifications found</p>
              <p className="text-sm text-gray-400 mt-1">You are all caught up!</p>
            </div>
          ) : (
            <AnimatePresence>
              {getFilteredNotifications().map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          getPriorityColor(notification.priority)
                        }`}>
                          {notification.priority || 'normal'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {notification.message}
                      </p>
                      
                      {notification.metadata && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                          <div className="grid grid-cols-2 gap-2">
                            {notification.metadata.auditId && (
                              <div>Audit ID: {notification.metadata.auditId}</div>
                            )}
                            {notification.metadata.lab && (
                              <div>Lab: {notification.metadata.lab}</div>
                            )}
                            {notification.metadata.assignedTo && (
                              <div>Assigned to: {notification.metadata.assignedTo}</div>
                            )}
                            {notification.metadata.dueDate && (
                              <div>Due: {new Date(notification.metadata.dueDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {getFilteredNotifications().length} of {notifications.length} notifications
            </span>
            <button
              onClick={fetchNotifications}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuditNotificationCenter;
