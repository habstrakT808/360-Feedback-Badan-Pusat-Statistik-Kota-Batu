// src/app/notifications/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationService } from "@/lib/notification-service";
import { useStore } from "@/store/useStore";
import {
  Bell,
  Search,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  RefreshCw,
  Calendar,
  Award,
  Clock,
  AlertTriangle,
  Info,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "react-hot-toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "unread" | "assessment" | "reminder" | "system"
  >("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, filterType]);

  const loadNotifications = async () => {
    try {
      const data = await NotificationService.getUserNotifications(
        user!.id,
        100
      );
      setNotifications(data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== "all") {
      if (filterType === "unread") {
        filtered = filtered.filter((n) => !n.is_read);
      } else {
        filtered = filtered.filter((n) => n.type === filterType);
      }
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(
        selectedNotifications.map((id) => NotificationService.markAsRead(id))
      );
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setSelectedNotifications([]);
      toast.success(
        `${selectedNotifications.length} notifications marked as read`
      );
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Delete ${selectedNotifications.length} notifications? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedNotifications.map((id) =>
          NotificationService.deleteNotification(id)
        )
      );
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.includes(n.id))
      );
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notifications deleted`);
    } catch (error) {
      toast.error("Failed to delete notifications");
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return Award;
      case "reminder":
        return Clock;
      case "deadline":
        return AlertTriangle;
      case "completion":
        return Check;
      case "system":
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "assessment":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200",
        };
      case "reminder":
        return {
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200",
        };
      case "deadline":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          border: "border-red-200",
        };
      case "completion":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          border: "border-green-200",
        };
      case "system":
        return {
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200",
        };
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

  const filterOptions = [
    { value: "all", label: "All Notifications", count: notifications.length },
    {
      value: "unread",
      label: "Unread",
      count: notifications.filter((n) => !n.is_read).length,
    },
    {
      value: "assessment",
      label: "Assessment",
      count: notifications.filter((n) => n.type === "assessment").length,
    },
    {
      value: "reminder",
      label: "Reminders",
      count: notifications.filter((n) => n.type === "reminder").length,
    },
    {
      value: "system",
      label: "System",
      count: notifications.filter((n) => n.type === "system").length,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Notifications
              </h1>
              <p className="text-gray-600">
                Manage all your notifications and alerts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadNotifications}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = "/settings")}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: "Total",
              value: notifications.length,
              icon: Bell,
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Unread",
              value: notifications.filter((n) => !n.is_read).length,
              icon: EyeOff,
              color: "from-orange-500 to-orange-600",
            },
            {
              title: "Today",
              value: notifications.filter(
                (n) =>
                  new Date(n.created_at).toDateString() ===
                  new Date().toDateString()
              ).length,
              icon: Calendar,
              color: "from-green-500 to-green-600",
            },
            {
              title: "High Priority",
              value: notifications.filter((n) =>
                ["high", "urgent"].includes(n.priority)
              ).length,
              icon: AlertTriangle,
              color: "from-red-500 to-red-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center">
                <div
                  className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilterType(option.value as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    filterType === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{option.label}</span>
                  {option.count > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        filterType === option.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {option.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedNotifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">
                    {selectedNotifications.length} notification
                    {selectedNotifications.length > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBulkMarkAsRead}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark as Read</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => setSelectedNotifications([])}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          {/* List Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={
                    selectedNotifications.length ===
                      filteredNotifications.length &&
                    filteredNotifications.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {filteredNotifications.length} notification
                  {filteredNotifications.length !== 1 ? "s" : ""}
                </span>
              </div>

              {notifications.filter((n) => !n.is_read).length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || filterType !== "all"
                    ? "No notifications found"
                    : "No notifications"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "You're all caught up! 🎉"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const IconComponent = getNotificationIcon(notification.type);
                const colors = getNotificationColor(notification.type);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(
                      notification.priority
                    )} ${!notification.is_read ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(
                          notification.id
                        )}
                        onChange={() =>
                          toggleNotificationSelection(notification.id)
                        }
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />

                      <div
                        className={`p-3 rounded-xl ${colors.bg} flex-shrink-0`}
                      >
                        <IconComponent className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`text-lg font-semibold ${
                                !notification.is_read
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {notification.priority === "urgent" && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                Urgent
                              </span>
                            )}
                            {notification.priority === "high" && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                High
                              </span>
                            )}
                            {!notification.is_read && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleDeleteNotification(notification.id)
                              }
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {formatDistanceToNow(
                                new Date(notification.created_at),
                                {
                                  addSuffix: true,
                                  locale: id,
                                }
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {format(
                                new Date(notification.created_at),
                                "PPP",
                                { locale: id }
                              )}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              {notification.type}
                            </span>
                          </div>

                          {notification.action_url &&
                            notification.action_label && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  window.location.href =
                                    notification.action_url;
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                {notification.action_label}
                              </motion.button>
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
