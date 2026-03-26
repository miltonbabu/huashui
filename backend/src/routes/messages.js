const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const aiService = require("../services/aiService");
const { protect } = require("../middleware/auth");

router.post("/", protect, async (req, res) => {
  const { conversationId, content, model } = req.body;
  const io = req.app.get("io");

  console.log("=== Message Request ===");
  console.log("ConversationId:", conversationId);
  console.log("ConversationId type:", typeof conversationId);
  console.log("Content:", content?.substring(0, 50));
  console.log("Model:", model);
  console.log("UserId:", req.user.id);

  if (!conversationId || !content) {
    return res.status(400).json({
      success: false,
      message: "Conversation ID and content are required",
    });
  }

  try {
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      console.log("✗ Conversation not found");
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    console.log("✓ Conversation found:", conversation.id);

    const selectedModel = model || conversation.model;
    console.log("Selected model:", selectedModel);

    const userMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "user",
      content,
    });
    console.log("✓ User message created:", userMessage.id);

    if (io) {
      io.to(`conversation-${conversationId}`).emit("new-message", {
        type: "user",
        message: userMessage,
      });
    }

    const previousMessages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
      limit: 20,
    });
    console.log("✓ Previous messages:", previousMessages.length);

    const formattedMessages = previousMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    if (io) {
      io.to(`conversation-${conversationId}`).emit("ai-typing", {
        conversationId,
        status: "generating",
      });
    }

    console.log("Calling AI service with model:", selectedModel);
    let aiResponse;
    let assistantMessage;

    try {
      // Use streaming for reasoning model to show real-time thinking
      if (selectedModel === "huashui-reasoning") {
        console.log("Using streaming for reasoning model");
        let fullReasoning = "";
        let fullContent = "";
        let totalTokens = 0;

        const streamGenerator =
          aiService.generateDeepSeekReasoningStream(formattedMessages);

        console.log('Starting to stream reasoning...');
        const roomName = `conversation-${String(conversationId)}`;
        console.log(`Streaming to room: ${roomName}`);
        
        for await (const chunk of streamGenerator) {
          if (chunk.type === "reasoning") {
            fullReasoning = chunk.fullReasoning;
            // Emit real-time reasoning to client
            if (io) {
              console.log(`Emitting ai-thinking, reasoning length: ${fullReasoning.length}`);
              io.to(roomName).emit("ai-thinking", {
                conversationId: String(conversationId),
                reasoning: chunk.content,
                fullReasoning: fullReasoning,
                status: "thinking",
              });
            }
          } else if (chunk.type === "content") {
            fullContent = chunk.fullContent;
            // Emit streaming content to client
            if (io) {
              console.log(`Emitting ai-streaming, content length: ${fullContent.length}`);
              io.to(roomName).emit("ai-streaming", {
                conversationId: String(conversationId),
                content: chunk.content,
                fullContent: fullContent,
                status: "streaming",
              });
            }
          }
        }

        // Estimate tokens (since streaming doesn't return token count)
        totalTokens = Math.ceil(
          (fullContent.length + fullReasoning.length) / 4,
        );

        aiResponse = {
          content: fullContent,
          model: selectedModel,
          tokens: totalTokens,
          finishReason: "stop",
          latency: 0,
          reasoning: fullReasoning,
        };

        console.log("✓ Streaming response complete");
        console.log("  Content length:", fullContent?.length);
        console.log("  Reasoning length:", fullReasoning?.length);
      } else {
        // Use non-streaming for regular model
        aiResponse = await aiService.generateResponse(
          selectedModel,
          formattedMessages,
        );
        console.log("✓ AI response received");
        console.log("  Tokens:", aiResponse.tokens);
        console.log("  Content length:", aiResponse.content?.length);
      }
    } catch (error) {
      console.error("✗ AI Service Error:", error.message);
      if (io) {
        io.to(`conversation-${conversationId}`).emit("ai-error", {
          conversationId,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: `AI Service Error: ${error.message}`,
      });
    }

    assistantMessage = await Message.create({
      conversationId,
      userId: req.user.id,
      role: "assistant",
      content: aiResponse.content,
      model: selectedModel,
      tokens: aiResponse.tokens,
      finishReason: aiResponse.finishReason,
      latency: aiResponse.latency,
      reasoning: aiResponse.reasoning || null,
    });
    console.log("✓ Assistant message created:", assistantMessage.id);

    // Auto-generate title from first user message if it's still "New Conversation"
    if (
      conversation.title === "New Conversation" &&
      conversation.messageCount === 0
    ) {
      const titleText =
        content.length > 40 ? content.substring(0, 40) + "..." : content;
      conversation.title = titleText;
    }

    conversation.lastMessageAt = new Date();
    conversation.messageCount += 2;
    conversation.totalTokens += aiResponse.tokens;
    conversation.estimatedCost += aiService.estimateCost(
      selectedModel,
      aiResponse.tokens,
    );
    await conversation.save();

    const user = await User.findByPk(req.user.id);
    user.totalMessages += 2;
    user.totalTokens += aiResponse.tokens;
    await user.save();

    if (io) {
      io.to(`conversation-${conversationId}`).emit("new-message", {
        type: "assistant",
        message: assistantMessage,
        metadata: {
          tokens: aiResponse.tokens,
          latency: aiResponse.latency,
          model: selectedModel,
        },
      });
    }

    console.log("✓ Message flow completed successfully");

    res.json({
      success: true,
      userMessage,
      assistantMessage,
      metadata: {
        tokens: aiResponse.tokens,
        latency: aiResponse.latency,
        model: selectedModel,
      },
    });
  } catch (error) {
    console.error("✗ Send message error:", error);
    console.error("  Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error processing message: " + error.message,
    });
  }
});

router.get("/:conversationId", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      count: messages.length,
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

router.put("/:id", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findOne({
      where: {
        id: message.conversationId,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this message",
      });
    }

    // Only allow editing user messages
    if (message.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Can only edit user messages",
      });
    }

    message.content = content;
    await message.save();

    res.json({
      success: true,
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating message",
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findOne({
      where: {
        id: message.conversationId,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    await Message.destroy({ where: { id: req.params.id } });

    conversation.messageCount = Math.max(0, conversation.messageCount - 1);
    await conversation.save();

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
    });
  }
});

module.exports = router;
