// src/components/notifications/NotificationBell.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Clock,
  AlertTriangle,
  Info,
  Award,
  Calendar,
} from "lucide-react";
import { NotificationService } from "@/lib/notification-service";
import { useStore } from "@/store/useStore";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "react-hot-toast";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [notificationsData, count] = await Promise.all([
        NotificationService.getUserNotifications(user!.id),
        NotificationService.getUnreadCount(user!.id),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = NotificationService.subscribeToNotifications(
      user!.id,
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast notification
        toast.custom(
          (t) => (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.3 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm"
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    getNotificationColor(newNotification.type).bg
                  }`}
                >
                  {getNotificationIcon(
                    newNotification.type,
                    getNotificationColor(newNotification.type).text
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {newNotification.title}
                  </h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {newNotification.message}
                  </p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ),
          { duration: 5000 }
        );
      }
    );

    // Advanced cleanup function with proper type handling
    return () => {
      try {
        if (subscription && typeof subscription === "function") {
          subscription();
        } else if (
          subscription &&
          typeof subscription === "object" &&
          subscription !== null
        ) {
          const subscriptionObj = subscription as { unsubscribe?: () => void };
          if (typeof subscriptionObj.unsubscribe === "function") {
            subscriptionObj.unsubscribe();
          }
        }
      } catch (error) {
        console.error("Error during subscription cleanup:", error);
      }
    };
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string, colorClass: string) => {
    const iconProps = { className: `w-4 h-4 ${colorClass}` };

    switch (type) {
      case "assessment":
        return <Award {...iconProps} />;
      case "reminder":
        return <Clock {...iconProps} />;
      case "deadline":
        return <AlertTriangle {...iconProps} />;
      case "completion":
        return <Check {...iconProps} />;
      case "system":
        return <Info {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "assessment":
        return { bg: "bg-blue-100", text: "text-blue-600" };
      case "reminder":
        return { bg: "bg-orange-100", text: "text-orange-600" };
      case "deadline":
        return { bg: "bg-red-100", text: "text-red-600" };
      case "completion":
        return { bg: "bg-green-100", text: "text-green-600" };
      case "system":
        return { bg: "bg-purple-100", text: "text-purple-600" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-blue-500";
      case "low":
        return "border-l-gray-300";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Bell className="w-5 h-5" />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] sm:max-h-[80vh] flex flex-col transform -translate-x-1/2 sm:translate-x-0 left-1/2 sm:left-auto sm:right-0"
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMarkAllAsRead}
                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                      >
                        Mark all read
                      </motion.button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {unreadCount} unread notification
                    {unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                      No notifications
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      You're all caught up! 🎉
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div
                            className={`p-1.5 sm:p-2 rounded-lg ${
                              getNotificationColor(notification.type).bg
                            } flex-shrink-0`}
                          >
                            {getNotificationIcon(
                              notification.type,
                              getNotificationColor(notification.type).text
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4
                                className={`text-xs sm:text-sm font-medium ${
                                  !notification.is_read
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                } leading-tight`}
                              >
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.is_read && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      handleMarkAsRead(notification.id)
                                    }
                                    className="p-1 text-blue-600 hover:text-blue-700 rounded"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </motion.button>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2 sm:mt-3">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(
                                  new Date(notification.created_at),
                                  {
                                    addSuffix: true,
                                    locale: id,
                                  }
                                )}
                              </span>

                              {notification.action_url &&
                                notification.action_label && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      window.location.href =
                                        notification.action_url;
                                      setIsOpen(false);
                                    }}
                                    className="text-xs bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                                  >
                                    {notification.action_label}
                                  </motion.button>
                                )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      window.location.href = "/notifications";
                      setIsOpen(false);
                    }}
                    className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm py-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View All Notifications
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
