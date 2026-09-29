import { env } from '../config/env.js';

const VECTOR_DIM = 64;

/**
 * High-dimensional vector generation service supporting local deterministic embedding hashing
 * and external AI API embeddings (Google Gemini / OpenAI).
 */
export const embeddingService = {
  async generateEmbedding(text) {
    if (env.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: text.substring(0, 2048) }] },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.embedding && data.embedding.values) {
            return this.normalizeVector(data.embedding.values);
          }
        }
      } catch (err) {
        console.warn('[EmbeddingService] Gemini embedding call failed, falling back to local vector engine:', err.message);
      }
    }

    // High-performance Local TF/N-gram Hashing Embedding Engine (Offline Viva Ready)
    return this.generateLocalVector(text);
  },

  generateLocalVector(text) {
    const vector = new Array(VECTOR_DIM).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_$]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter((t) => t.length > 1);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Feature hashing into vector dimensions
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const dimIndex = Math.abs(hash) % VECTOR_DIM;
      vector[dimIndex] += 1.0;

      // Character bi-gram hashing
      if (token.length >= 3) {
        for (let k = 0; k < token.length - 1; k++) {
          const bigram = token.substring(k, k + 2);
          let bHash = 0;
          for (let m = 0; m < bigram.length; m++) {
            bHash = (bHash << 3) - bHash + bigram.charCodeAt(m);
            bHash |= 0;
          }
          const bDim = Math.abs(bHash) % VECTOR_DIM;
          vector[bDim] += 0.5;
        }
      }
    }

    return this.normalizeVector(vector);
  },

  normalizeVector(vec) {
    const mag = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (mag === 0) return vec;
    return vec.map((val) => val / mag);
  },

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const minLen = Math.min(vecA.length, vecB.length);
    let dot = 0;
    for (let i = 0; i < minLen; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  },
};
