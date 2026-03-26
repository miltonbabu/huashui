"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertCircle,
  LogOut,
  Layers,
  ChevronRight,
  Trash2,
  Edit,
  Ban,
  CheckCircle,
  Search,
  Eye,
  X,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
  Clock,
  Key,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";

type TimeFilter = "today" | "week" | "month" | "all";

interface DashboardStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  newUsersToday: number;
  newConversationsToday: number;
  newMessagesToday: number;
  previousPeriodUsers: number;
  previousPeriodConversations: number;
  previousPeriodMessages: number;
}

interface ChartData {
  labels: string[];
  users: number[];
  conversations: number[];
  messages: number[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  totalMessages: number;
  totalTokens: number;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

interface Conversation {
  id: number;
  title: string;
  model: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
  conversationId: number;
}

type TabType = "dashboard" | "users" | "conversations" | "messages";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading, checkAuth } =
    useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [viewingUserConversations, setViewingUserConversations] = useState<
    number | null
  >(null);
  const [editMode, setEditMode] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const initAdmin = async () => {
      await checkAuth();
    };
    initAdmin();
  }, [checkAuth]);

  // Real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRealtime && activeTab === "dashboard") {
      interval = setInterval(() => {
        fetchDashboardData(timeFilter);
        setLastUpdated(new Date());
      }, 5000); // Update every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isRealtime, activeTab, timeFilter]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "admin") {
      console.log("User role:", user.role, "- redirecting to home");
      router.push("/");
      return;
    }

    if (user?.role === "admin") {
      setLoading(true);
      fetchDashboardData(timeFilter);
    }
  }, [isAuthenticated, user, router, isLoading, timeFilter]);

  const fetchDashboardData = useCallback(
    async (filter: TimeFilter = "today") => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard?period=${filter}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setStats(data.stats);
        setUsers(data.recentUsers);
        setChartData(data.chartData);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    },
    [timeFilter],
  );

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users${searchQuery ? `?search=${searchQuery}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  };

  const fetchConversations = async (userId?: number) => {
    try {
      const token = localStorage.getItem("token");
      const url = userId
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/conversations?userId=${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/conversations`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      setConversations(data.conversations);
      if (userId) {
        setViewingUserConversations(userId);
      } else {
        setViewingUserConversations(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError(null);
    if (tab === "users") fetchUsers();
    if (tab === "conversations") fetchConversations();
    if (tab === "dashboard") fetchDashboardData();
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This will also delete all their conversations and messages.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete user");

      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (
    userId: number,
    currentStatus: boolean,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        },
      );

      if (!response.ok) throw new Error("Failed to update user status");

      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status",
      );
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const updateData: Record<string, unknown> = {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        isActive: editUserData.isActive,
      };

      if (editUserData.newPassword && editUserData.newPassword.trim() !== "") {
        updateData.newPassword = editUserData.newPassword;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) throw new Error("Failed to update user");

      setShowUserModal(false);
      setEditMode(false);
      setEditUserData({ ...editUserData, newPassword: "" });
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (!window.confirm("Are you sure you want to delete this conversation?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete conversation");

      fetchConversations(viewingUserConversations || undefined);
      fetchDashboardData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete conversation",
      );
    }
  };

  const handleViewUserConversations = (userId: number) => {
    setActiveTab("conversations");
    fetchConversations(userId);
  };

  const handleDeleteUserData = async (userId: number, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ALL conversations and messages for ${userName}? This action cannot be undone.`,
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/data`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user data");
      }

      fetchUsers();
      fetchDashboardData();
      if (viewingUserConversations === userId) {
        fetchConversations();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete user data",
      );
    }
  };

  const handleDeleteAllUserData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL conversations and messages for ALL non-admin users? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/conversations/all-users`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete all user data");
      }

      fetchConversations();
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete all user data",
      );
    }
  };

  const handleViewConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
    setShowConversationModal(true);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      newPassword: "",
    });
    setShowPassword(false);
    setEditMode(true);
    setShowUserModal(true);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && activeTab === "dashboard") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertCircle className="w-12 h-12" />
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      change: stats
        ? (
            ((stats.totalUsers - stats.previousPeriodUsers) /
              Math.max(stats.previousPeriodUsers, 1)) *
            100
          ).toFixed(1)
        : "0",
      isPositive: stats ? stats.totalUsers >= stats.previousPeriodUsers : true,
    },
    {
      title: "Conversations",
      value: stats?.totalConversations || 0,
      icon: MessageSquare,
      color: "from-green-500 to-green-600",
      change: stats
        ? (
            ((stats.totalConversations - stats.previousPeriodConversations) /
              Math.max(stats.previousPeriodConversations, 1)) *
            100
          ).toFixed(1)
        : "0",
      isPositive: stats
        ? stats.totalConversations >= stats.previousPeriodConversations
        : true,
    },
    {
      title: "Messages",
      value: stats?.totalMessages || 0,
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      change: stats
        ? (
            ((stats.totalMessages - stats.previousPeriodMessages) /
              Math.max(stats.previousPeriodMessages, 1)) *
            100
          ).toFixed(1)
        : "0",
      isPositive: stats
        ? stats.totalMessages >= stats.previousPeriodMessages
        : true,
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      change: "+12.5",
      isPositive: true,
    },
  ];

  const timeFilters = [
    { id: "today" as TimeFilter, label: "Today", icon: Clock },
    { id: "week" as TimeFilter, label: "This Week", icon: Calendar },
    { id: "month" as TimeFilter, label: "This Month", icon: BarChart3 },
    { id: "all" as TimeFilter, label: "All Time", icon: Database },
  ];

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Activity },
    { id: "users" as TabType, label: "Users", icon: Users },
    {
      id: "conversations" as TabType,
      label: "Conversations",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">HuaShui AI Admin</h1>
              <p className="text-xs text-muted-foreground">
                Administration Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Time Filter & Real-time Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setTimeFilter(filter.id);
                        fetchDashboardData(filter.id);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        timeFilter === filter.id
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                      )}
                    >
                      <filter.icon className="w-4 h-4" />
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {/* Real-time Toggle */}
                  <button
                    onClick={() => setIsRealtime(!isRealtime)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-xl border",
                      isRealtime
                        ? "bg-green-500/10 border-green-500/30 text-green-500 shadow-lg shadow-green-500/20"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isRealtime ? (
                      <>
                        <Wifi className="w-4 h-4 animate-pulse" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4" />
                        <span>Offline</span>
                      </>
                    )}
                  </button>

                  {/* Last Updated */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw
                      className={cn("w-3 h-3", isRealtime && "animate-spin")}
                    />
                    <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid - Glassmorphism Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-6 shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                  >
                    {/* Glow Effect */}
                    <div
                      className={cn(
                        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-gradient-to-br",
                        stat.color,
                      )}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                            stat.color,
                          )}
                        >
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            stat.isPositive
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20",
                          )}
                        >
                          {stat.isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(Number(stat.change))}%
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {stat.value.toLocaleString()}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chart Section */}
              {chartData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-6 shadow-2xl"
                >
                  <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-primary to-purple-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Activity Overview
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          User engagement over{" "}
                          {timeFilter === "today"
                            ? "the day"
                            : timeFilter === "week"
                              ? "the week"
                              : timeFilter === "month"
                                ? "the month"
                                : "all time"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-xs text-muted-foreground">
                            Users
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">
                            Conversations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-2">
                      {chartData.labels.map((label, i) => (
                        <div
                          key={`chart-${i}`}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div className="w-full flex gap-1 h-48 items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${(chartData.users[i] / Math.max(...chartData.users, 1)) * 100}%`,
                              }}
                              transition={{ delay: i * 0.05, duration: 0.5 }}
                              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                            />
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{
                                height: `${(chartData.conversations[i] / Math.max(...chartData.conversations, 1)) * 100}%`,
                              }}
                              transition={{
                                delay: i * 0.05 + 0.1,
                                duration: 0.5,
                              }}
                              className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Recent Users</h2>
                  <button
                    onClick={() => handleTabChange("users")}
                    className="text-sm text-primary hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Conversations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{u.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  u.role === "admin"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-secondary text-secondary-foreground",
                                )}
                              >
                                {u.role}
                              </span>
                              {u.role === "admin" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                  SUPERADMIN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                u.isActive
                                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                  : "bg-red-500/20 text-red-600 dark:text-red-400",
                              )}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {u.role !== "admin" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleToggleUserStatus(u.id, u.isActive)
                                    }
                                    className={cn(
                                      "p-1.5 rounded-lg hover:bg-accent",
                                      u.isActive
                                        ? "text-orange-500"
                                        : "text-green-500",
                                    )}
                                    title={
                                      u.isActive
                                        ? "Deactivate user"
                                        : "Activate user"
                                    }
                                  >
                                    {u.isActive ? (
                                      <Ban className="w-4 h-4" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                  <h2 className="font-semibold text-lg">All Users</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={fetchUsers}
                      className="p-2 rounded-lg hover:bg-accent"
                      title="Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Messages
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-medium">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{u.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                u.role === "admin"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-secondary text-secondary-foreground",
                              )}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {u.totalMessages}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {u.totalTokens?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                u.isActive
                                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                  : "bg-red-500/20 text-red-600 dark:text-red-400",
                              )}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {u.lastLogin
                              ? new Date(u.lastLogin).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewUserConversations(u.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                              title="View all conversations"
                            >
                              <MessageSquare className="w-3 h-3" />
                              View Chats
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleUserStatus(u.id, u.isActive)
                                }
                                className={cn(
                                  "p-1.5 rounded-lg hover:bg-accent",
                                  u.isActive
                                    ? "text-orange-500"
                                    : "text-green-500",
                                )}
                                title={
                                  u.isActive
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                              >
                                {u.isActive ? (
                                  <Ban className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              {u.role !== "admin" && (
                                <button
                                  onClick={() =>
                                    handleDeleteUserData(u.id, u.name)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive"
                                  title="Delete all user data (conversations & messages)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {u.role !== "admin" && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                  title="Delete user account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "conversations" && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {viewingUserConversations
                        ? `Conversations for User #${viewingUserConversations}`
                        : "All Conversations"}
                    </h2>
                    {viewingUserConversations && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Showing conversations for a specific user
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!viewingUserConversations && (
                      <button
                        onClick={handleDeleteAllUserData}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium"
                        title="Delete all conversations for all non-admin users"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete All User Data
                      </button>
                    )}
                    {viewingUserConversations && (
                      <button
                        onClick={() => fetchConversations()}
                        className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                      >
                        Show All
                      </button>
                    )}
                    <button
                      onClick={() =>
                        fetchConversations(
                          viewingUserConversations || undefined,
                        )
                      }
                      className="p-2 rounded-lg hover:bg-accent"
                      title="Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Messages
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {conversations.map((conv) => (
                        <tr
                          key={conv.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <p className="font-medium text-sm truncate max-w-[200px]">
                                {conv.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium">
                                {conv.userName
                                  ? conv.userName.charAt(0).toUpperCase()
                                  : "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {conv.userName || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {conv.userEmail || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                conv.model === "huashui-reasoning"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-secondary text-secondary-foreground",
                              )}
                            >
                              {conv.model === "huashui-reasoning"
                                ? "Reasoning"
                                : "Standard"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {conv.messageCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(conv.lastMessageAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewConversation(conv)}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                                title="View messages"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteConversation(conv.id)
                                }
                                className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to Chat
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Edit User</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-lg hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={editUserData.name}
                    onChange={(e) =>
                      setEditUserData({ ...editUserData, name: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) =>
                      setEditUserData({
                        ...editUserData,
                        email: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) =>
                      setEditUserData({ ...editUserData, role: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editUserData.isActive}
                    onChange={(e) =>
                      setEditUserData({
                        ...editUserData,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active
                  </label>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">
                      Reset Password
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Leave empty to keep current password
                  </p>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editUserData.newPassword}
                      onChange={(e) =>
                        setEditUserData({
                          ...editUserData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Messages Modal */}
      <AnimatePresence>
        {showConversationModal && selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowConversationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedConversation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.messageCount} messages
                  </p>
                </div>
                <button
                  onClick={() => setShowConversationModal(false)}
                  className="p-2 rounded-lg hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg",
                      msg.role === "user"
                        ? "bg-primary/10 ml-8"
                        : "bg-muted mr-8",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          msg.role === "user"
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {msg.role === "user" ? "User" : "Assistant"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages found
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
