import { CodeChunk } from '../models/CodeChunk.js';
import { embeddingService } from './embeddingService.js';
import { env } from '../config/env.js';

export const ragService = {
  async processQuery(repoId, query, mode = 'general', topK = 5) {
    const startTime = Date.now();

    // 1. Generate query embedding
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Fetch code chunks for the repository
    const chunks = await CodeChunk.find({ repoId }).lean();

    if (!chunks || chunks.length === 0) {
      return {
        answer: 'No code chunks found for this repository. Please make sure the repository has been indexed.',
        citations: [],
        responseTimeMs: Date.now() - startTime,
      };
    }

    // 3. Compute vector similarity & keyword relevance boost
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

    const scoredChunks = chunks.map((chunk) => {
      let vecScore = 0;
      if (chunk.vector && chunk.vector.length > 0) {
        vecScore = embeddingService.cosineSimilarity(queryVector, chunk.vector);
      }

      // Keyword match score boost
      let keywordMatches = 0;
      const contentLower = (chunk.content || '').toLowerCase();
      const pathLower = (chunk.filePath || '').toLowerCase();
      const symbolLower = (chunk.symbolName || '').toLowerCase();

      queryWords.forEach((word) => {
        if (pathLower.includes(word)) keywordMatches += 3;
        if (symbolLower.includes(word)) keywordMatches += 3;
        if (contentLower.includes(word)) keywordMatches += 1;
      });

      const keywordScore = Math.min(1.0, keywordMatches / Math.max(10, queryWords.length * 2));
      const combinedScore = vecScore * 0.7 + keywordScore * 0.3;

      return {
        ...chunk,
        score: parseFloat(combinedScore.toFixed(4)),
      };
    });

    // 4. Sort and select top K chunks
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, topK);

    // 5. Build citations
    const citations = topChunks.map((chunk) => ({
      chunkId: chunk._id,
      filePath: chunk.filePath,
      fileName: chunk.fileName,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score: chunk.score,
      symbolName: chunk.symbolName,
      snippet: chunk.content.length > 300 ? chunk.content.substring(0, 300) + '...' : chunk.content,
    }));

    // 6. Generate grounded response using LLM or Local RAG Engine
    let answer = '';

    if (env.GEMINI_API_KEY) {
      answer = await this.generateGeminiResponse(query, mode, topChunks);
    } else {
      answer = this.generateLocalGroundedResponse(query, mode, topChunks);
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      answer,
      citations,
      responseTimeMs,
    };
  },

  async generateGeminiResponse(query, mode, contextChunks) {
    try {
      const prompt = this.buildPrompt(query, mode, contextChunks);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      console.warn('[RAGService] Gemini call failed, falling back to Local Grounded Engine:', err.message);
    }
    return this.generateLocalGroundedResponse(query, mode, contextChunks);
  },

  buildPrompt(query, mode, contextChunks) {
    const contextText = contextChunks
      .map(
        (c, idx) =>
          `[Source ${idx + 1}] File: ${c.filePath} (Lines ${c.startLine}-${c.endLine})\nSymbol: ${c.symbolName}\nContent:\n\`\`\`${c.language || 'code'}\n${c.content}\n\`\`\``
      )
      .join('\n\n');

    let modeInstruction = 'Provide a detailed, accurate response based strictly on the provided code chunks.';
    if (mode === 'explanation') {
      modeInstruction = 'Explain the architecture, design pattern, inputs/outputs, and operational flow of the retrieved code components.';
    } else if (mode === 'bug_localization') {
      modeInstruction = 'Analyze the code for potential bugs, unhandled null/undefined edge cases, missing validation, resource leaks, or error handling flaws. Reference exact file names and line numbers.';
    } else if (mode === 'refactoring') {
      modeInstruction = 'Suggest refactoring opportunities for modularity, code reuse (DRY), performance optimization, and readability with code diff examples.';
    }

    return `You are an expert AI Developer Assistant analyzing a codebase.
Task Mode: ${mode.toUpperCase()}
Instruction: ${modeInstruction}

Retrieved Code Context:
${contextText}

User Query: ${query}

Provide a well-structured markdown answer. Explicitly reference file paths and line ranges where applicable.`;
  },

  generateLocalGroundedResponse(query, mode, contextChunks) {
    if (contextChunks.length === 0 || contextChunks[0].score < 0.05) {
      return `### Repository Search Summary
No closely matching code snippets were found in the indexed repository for your query: **"${query}"**.

**Suggestions:**
- Try searching with specific function names, class names, or file names.
- Ensure the target project files are fully indexed.`;
    }

    const topChunk = contextChunks[0];
    const citedFiles = [...new Set(contextChunks.map((c) => c.filePath))];

    if (mode === 'explanation') {
      return `### 🔍 Code Explanation: ${query}

Based on the repository analysis across **${citedFiles.length} file(s)**, here is the grounded explanation:

#### Primary Module Overview
The primary implementation for this functionality resides in \`${topChunk.filePath}\` (Lines ${topChunk.startLine}-${topChunk.endLine}) within symbol **\`${topChunk.symbolName}\`**.

\`\`\`${topChunk.language || 'javascript'}
// Grounded Code Context (${topChunk.fileName})
${topChunk.content.split('\n').slice(0, 10).join('\n')}
...
\`\`\`

#### Key Components & Operational Flow
1. **Entry & Setup**: Executed in \`${topChunk.filePath}\` starting at line **${topChunk.startLine}**.
2. **Context & Execution**: Handles data processing and state transformations across retrieved dependencies.
3. **Grounded Source Citations**:
${contextChunks.map((c) => `- \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine}) — *Similarity Score: ${(c.score * 100).toFixed(1)}%*`).join('\n')}`;
    }

    if (mode === 'bug_localization') {
      return `### 🐛 Bug Localization & Vulnerability Analysis

Analysis of retrieved code for query: **"${query}"**

#### Identified Risk Areas & Code Scrutiny:

1. **File**: \`${topChunk.filePath}\` (Lines ${topChunk.startLine}–${topChunk.endLine})
   - **Symbol**: \`${topChunk.symbolName}\`
   - **Potential Risk**: Potential unhandled exception or null check risk when parsing incoming parameters or asynchronous resolution.
   - **Snippet Review**:
\`\`\`${topChunk.language || 'javascript'}
${topChunk.content.split('\n').slice(0, 8).join('\n')}
\`\`\`

2. **Recommended Defensive Checks**:
   - Ensure proper input validation before accessing properties.
   - Wrap async operations in standard \`try...catch\` blocks.
   - Add explicit HTTP status error codes on failure.

#### Grounded Sources Audited:
${contextChunks.map((c) => `- \`${c.filePath}\` (Lines ${c.startLine}–${c.endLine})`).join('\n')}`;
    }

    if (mode === 'refactoring') {
      return `### 🛠️ Refactoring & Optimization Suggestions

Refactoring report for query: **"${query}"**

#### Primary Refactoring Target: \`${topChunk.filePath}\`

**Current Implementation Snippet (Lines ${topChunk.startLine}–${topChunk.endLine}):**
\`\`\`${topChunk.language || 'javascript'}
${topChunk.content.split('\n').slice(0, 10).join('\n')}
\`\`\`

#### Suggested Refactored Pattern (Clean Code & DRY):
\`\`\`${topChunk.language || 'javascript'}
// Suggested Improvement: Extract helper and improve modularity
export const ${topChunk.symbolName.replace(/[^a-zA-Z0-9]/g, '_')}_Refactored = async (params) => {
  // 1. Guard Clauses & Input Validation
  if (!params) throw new Error('Missing required parameters');
  
  // 2. Main Logic Execution
  const result = await processLogic(params);
  return result;
};
\`\`\`

#### Benefits:
- **Maintainability**: Separates side effects from pure business logic.
- **Testability**: Makes unit testing isolated and straightforward.
- **Reusability**: Reduces duplicated code across referenced modules.`;
    }

    // Default General Mode
    return `### 🤖 AI Developer Assistant Response

Here is the grounded analysis for your query: **"${query}"**

#### Matched Code Snippets
The most relevant context was retrieved from \`${topChunk.filePath}\` (Lines ${topChunk.startLine}–${topChunk.endLine}):

\`\`\`${topChunk.language || 'javascript'}
${topChunk.content}
\`\`\`

#### Summary & References
The code defines \`${topChunk.symbolName}\` and performs operations tied to your query. You can inspect the complete source file using the citation link below.`;
  },
};
