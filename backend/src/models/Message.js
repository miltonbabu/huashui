const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  model: {
    type: DataTypes.ENUM('huashui-1', 'huashui-reasoning'),
    allowNull: true
  },
  tokens: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  finishReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latency: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'messages'
});

module.exports = Message;
