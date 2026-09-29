import mongoose from 'mongoose';

const codeChunkSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    startLine: {
      type: Number,
      required: true,
    },
    endLine: {
      type: Number,
      required: true,
    },
    chunkType: {
      type: String,
      enum: ['function', 'class', 'module', 'block', 'config', 'documentation'],
      default: 'block',
    },
    symbolName: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    content: {
      type: String,
      required: true,
    },
    vector: {
      type: [Number],
      default: [],
    },
    keywords: [String],
  },
  { timestamps: true }
);

codeChunkSchema.index({ repoId: 1, filePath: 1 });
codeChunkSchema.index({ repoId: 1, chunkType: 1 });

export const CodeChunk = mongoose.model('CodeChunk', codeChunkSchema);
