import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat Session',
    },
    mode: {
      type: String,
      enum: ['general', 'explanation', 'bug_localization', 'refactoring'],
      default: 'general',
    },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
