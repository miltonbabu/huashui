const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New Conversation',
    validate: {
      len: [0, 200]
    }
  },
  model: {
    type: DataTypes.ENUM('huashui-1', 'huashui-reasoning'),
    allowNull: false
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  totalTokens: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  estimatedCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'conversations'
});

module.exports = Conversation;
