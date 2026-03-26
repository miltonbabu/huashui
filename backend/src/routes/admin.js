const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", async (req, res) => {
  try {
    const { period = "today" } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, previousStartDate, previousEndDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = startDate;
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = startDate;
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate = startDate;
        break;
      default: // "all"
        startDate = new Date(0); // Beginning of time
        previousStartDate = new Date(0);
        previousEndDate = new Date(0);
    }

    // Current period stats
    const totalUsers = await User.count({
      where: period !== "all" ? { createdAt: { [Op.gte]: startDate } } : {},
    });
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalConversations = await Conversation.count({
      where: period !== "all" ? { createdAt: { [Op.gte]: startDate } } : {},
    });
    const totalMessages = await Message.count({
      where: period !== "all" ? { createdAt: { [Op.gte]: startDate } } : {},
    });

    // Previous period stats for comparison
    const previousPeriodUsers = await User.count({
      where:
        period !== "all"
          ? {
              createdAt: {
                [Op.gte]: previousStartDate,
                [Op.lt]: previousEndDate,
              },
            }
          : {},
    });
    const previousPeriodConversations = await Conversation.count({
      where:
        period !== "all"
          ? {
              createdAt: {
                [Op.gte]: previousStartDate,
                [Op.lt]: previousEndDate,
              },
            }
          : {},
    });
    const previousPeriodMessages = await Message.count({
      where:
        period !== "all"
          ? {
              createdAt: {
                [Op.gte]: previousStartDate,
                [Op.lt]: previousEndDate,
              },
            }
          : {},
    });

    // Today's specific stats
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newUsersToday = await User.count({
      where: { createdAt: { [Op.gte]: today } },
    });
    const newConversationsToday = await Conversation.count({
      where: { createdAt: { [Op.gte]: today } },
    });
    const newMessagesToday = await Message.count({
      where: { createdAt: { [Op.gte]: today } },
    });

    // Generate chart data
    const chartData = await generateChartData(period);

    const recentUsers = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalConversations,
        totalMessages,
        activeUsers,
        newUsersToday,
        newConversationsToday,
        newMessagesToday,
        previousPeriodUsers,
        previousPeriodConversations,
        previousPeriodMessages,
      },
      chartData,
      recentUsers,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
    });
  }
});

// Helper function to generate chart data
async function generateChartData(period) {
  const now = new Date();
  const labels = [];
  const users = [];
  const conversations = [];
  const messages = [];

  let intervals, dateFormat;

  switch (period) {
    case "today":
      intervals = 24; // Hours
      dateFormat = (date) => `${date.getHours()}:00`;
      for (let i = 0; i < intervals; i++) {
        const date = new Date(now);
        date.setHours(i, 0, 0, 0);
        labels.push(dateFormat(date));
      }
      break;
    case "week":
      intervals = 7; // Days
      dateFormat = (date) =>
        date.toLocaleDateString("en-US", { weekday: "short" });
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(dateFormat(date));
      }
      break;
    case "month":
      intervals = 30; // Days
      dateFormat = (date) => `${date.getDate()}`;
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(dateFormat(date));
      }
      break;
    default: // "all"
      intervals = 12; // Months
      dateFormat = (date) =>
        date.toLocaleDateString("en-US", { month: "short" });
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        labels.push(dateFormat(date));
      }
  }

  // Generate sample data (in production, you'd query the database for each interval)
  for (let i = 0; i < labels.length; i++) {
    users.push(Math.floor(Math.random() * 50) + 10);
    conversations.push(Math.floor(Math.random() * 100) + 20);
    messages.push(Math.floor(Math.random() * 500) + 100);
  }

  return { labels, users, conversations, messages };
}

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalConversations = await Conversation.count();
    const totalMessages = await Message.count();

    const usersWithStats = await User.findAll({
      attributes: {
        include: ["totalMessages", "totalTokens"],
      },
    });

    let totalUserMessages = 0;
    let totalUserTokens = 0;
    usersWithStats.forEach((u) => {
      totalUserMessages += u.totalMessages || 0;
      totalUserTokens += u.totalTokens || 0;
    });

    const huashui1Convs = await Conversation.count({
      where: { model: "huashui-1" },
    });
    const huashuiReasoningConvs = await Conversation.count({
      where: { model: "huashui-reasoning" },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeConversations = await Conversation.count({
      where: {
        lastMessageAt: {
          [require("sequelize").Op.gte]: sevenDaysAgo,
        },
      },
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          recentRegistrations: totalUsers,
        },
        conversations: {
          total: totalConversations,
          active: activeConversations,
        },
        messages: {
          total: totalMessages,
          totalByUsers: totalUserMessages,
        },
        tokens: {
          total: totalUserTokens,
        },
        models: {
          huashui1: { conversations: huashui1Convs },
          huashuiReasoning: { conversations: huashuiReasoningConvs },
        },
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { search, role, isActive } = req.query;

    let where = {};
    if (search) {
      where[require("sequelize").Op.or] = [
        { name: { [require("sequelize").Op.like]: `%${search}%` } },
        { email: { [require("sequelize").Op.like]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const conversationCount = await Conversation.count({
      where: { userId: req.params.id },
    });
    const messageCount = await Message.count({
      where: { userId: req.params.id },
    });

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        stats: {
          conversations: conversationCount,
          messages: messageCount,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, role, isActive, newPassword } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user.id === user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    // Prevent deactivation of admin users
    if (user.role === "admin" && isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate admin users",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (newPassword) {
      // Let the model's beforeUpdate hook handle the hashing
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user.id === user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Prevent deletion of admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    const conversations = await Conversation.findAll({
      where: { userId: req.params.id },
    });
    const conversationIds = conversations.map((c) => c.id);

    await Message.destroy({ where: { conversationId: conversationIds } });
    await Conversation.destroy({ where: { userId: req.params.id } });
    await User.destroy({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: "User and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
});

router.get("/conversations", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const { userId } = req.query;

    let where = {};
    if (userId) {
      where.userId = userId;
    }

    const { count, rows: conversations } = await Conversation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role"],
          as: "user",
        },
      ],
      order: [["lastMessageAt", "DESC"]],
      limit,
      offset,
    });

    const conversationsWithUser = conversations.map((conv) => ({
      ...conv.toJSON(),
      userName: conv.user ? conv.user.name : "Unknown",
      userEmail: conv.user ? conv.user.email : "Unknown",
      userRole: conv.user ? conv.user.role : "unknown",
    }));

    res.json({
      success: true,
      conversations: conversationsWithUser,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
    });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { conversationId: req.params.id },
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
    });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await Message.destroy({ where: { conversationId: req.params.id } });
    await Conversation.destroy({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting conversation",
    });
  }
});

// Delete all conversations and messages for a specific user
router.delete("/users/:id/data", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete data for admin users",
      });
    }

    const conversations = await Conversation.findAll({
      where: { userId: req.params.id },
    });
    const conversationIds = conversations.map((c) => c.id);

    await Message.destroy({ where: { conversationId: conversationIds } });
    await Conversation.destroy({ where: { userId: req.params.id } });

    res.json({
      success: true,
      message: "All user data deleted successfully",
    });
  } catch (error) {
    console.error("Delete user data error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user data",
    });
  }
});

// Delete all conversations and messages for all non-admin users
router.delete("/conversations/all-users", async (req, res) => {
  try {
    const nonAdminUsers = await User.findAll({
      where: { role: { [Op.ne]: "admin" } },
      attributes: ["id"],
    });

    if (nonAdminUsers.length === 0) {
      return res.json({
        success: true,
        message: "No non-admin users found",
        deletedConversations: 0,
        deletedMessages: 0,
      });
    }

    const nonAdminUserIds = nonAdminUsers.map((u) => u.id);

    const conversations = await Conversation.findAll({
      where: { userId: { [Op.in]: nonAdminUserIds } },
    });

    let deletedMessages = 0;
    let deletedConversations = 0;

    if (conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      deletedMessages = await Message.destroy({
        where: { conversationId: { [Op.in]: conversationIds } },
      });
      deletedConversations = await Conversation.destroy({
        where: { userId: { [Op.in]: nonAdminUserIds } },
      });
    }

    res.json({
      success: true,
      message: "All user data deleted successfully",
      deletedConversations,
      deletedMessages,
    });
  } catch (error) {
    console.error("Delete all user data error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting all user data",
      error: error.message,
    });
  }
});

module.exports = router;
