import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const token = localStorage.getItem('token');

  const fetchNotifications = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/notifications/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications(res.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setFetchError('Error fetching notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`https://backend-pharmacy-5541.onrender.com/api/notifications/mark-read/${notificationId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
      <h2 className="text-2xl font-bold text-[#0B3861] mb-6">Notifications</h2>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3861]"></div>
        </div>
      ) : fetchError ? (
        <div className="bg-[#F5F9FD] border-l-4 border-[#0B3861] p-4 rounded-lg">
          <p className="text-[#0B3861]">{fetchError}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#F5F9FD] p-4 rounded-lg border border-[#BCE0FD]">
          <p className="text-[#64B5F6]">No notifications found.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              className={`p-4 rounded-lg shadow-lg border-l-4 ${
                notification.read 
                  ? 'bg-[#F5F9FD] border-[#64B5F6]' 
                  : 'bg-white border-[#0B3861]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    notification.type === 'error'
                      ? 'bg-[#F5F9FD] text-[#0B3861]'
                      : notification.type === 'warning'
                      ? 'bg-[#F5F9FD] text-[#1E88E5]'
                      : 'bg-[#F5F9FD] text-[#64B5F6]'
                  }`}>
                    {notification.type.toUpperCase()}
                  </span>
                  <p className="mt-2 text-[#0B3861]">{notification.message}</p>
                  <p className="mt-1 text-xs text-[#64B5F6]">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="px-3 py-1 bg-[#0B3861] text-white rounded hover:bg-[#1E88E5] transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPage;
