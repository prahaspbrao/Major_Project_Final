import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Repository name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    localPath: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'JavaScript/TypeScript',
    },
    status: {
      type: String,
      enum: ['pending', 'indexing', 'indexed', 'failed'],
      default: 'pending',
    },
    stats: {
      totalFiles: { type: Number, default: 0 },
      totalChunks: { type: Number, default: 0 },
      totalLines: { type: Number, default: 0 },
      languageBreakdown: { type: Map, of: Number, default: {} },
    },
    indexedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

repositorySchema.index({ owner: 1, name: 1 });

export const Repository = mongoose.model('Repository', repositorySchema);
