const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { archived } = req.query;

    const query = { userId: req.user.id };
    if (archived !== undefined) {
      query.isArchived = archived === 'true';
    }

    const conversations = await Conversation.findAll({
      where: query,
      order: [['lastMessageAt', 'DESC']]
    });

    // Get last message preview for each conversation
    const conversationsWithPreview = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          where: { conversationId: conv.id },
          order: [['createdAt', 'DESC']]
        });
        
        return {
          ...conv.toJSON(),
          lastMessagePreview: lastMessage ? 
            (lastMessage.content.length > 50 ? 
              lastMessage.content.substring(0, 50) + '...' : 
              lastMessage.content) : 
            null
        };
      })
    );

    res.json({
      success: true,
      count: conversations.length,
      conversations: conversationsWithPreview
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, model } = req.body;

    if (!model || !['huashui-1', 'huashui-reasoning'].includes(model)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid model specified'
      });
    }

    const conversation = await Conversation.create({
      userId: req.user.id,
      title: title || 'New Conversation',
      model
    });

    console.log('✓ Created conversation:', JSON.stringify(conversation.toJSON()));

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { title, isArchived, tags } = req.body;

    const conversation = await Conversation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (title !== undefined) conversation.title = title;
    if (isArchived !== undefined) conversation.isArchived = isArchived;
    if (tags !== undefined) conversation.tags = tags;

    await conversation.save();

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating conversation'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    await Message.destroy({ where: { conversationId: req.params.id } });
    await Conversation.destroy({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation'
    });
  }
});

router.get('/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.findAll({
      where: { conversationId: req.params.id },
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

module.exports = router;
