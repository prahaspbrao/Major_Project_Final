import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
  chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeChunk' },
  filePath: String,
  fileName: String,
  startLine: Number,
  endLine: Number,
  score: Number,
  symbolName: String,
  snippet: String,
});

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['general', 'explanation', 'bug_localization', 'refactoring'],
      default: 'general',
    },
    content: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
    cached: {
      type: Boolean,
      default: false,
    },
    responseTimeMs: Number,
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
