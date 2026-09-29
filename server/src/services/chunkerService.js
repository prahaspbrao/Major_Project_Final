import path from 'path';

/**
 * Parses source code into semantic chunks (functions, classes, blocks, exports)
 * with precise metadata: startLine, endLine, chunkType, symbolName.
 */
export const chunkerService = {
  chunkFile(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const lines = content.split('\n');
    const totalLines = lines.length;

    // Supported text formats
    const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.php', '.html', '.css', '.json', '.md', '.sql'];
    if (!codeExts.includes(ext) && totalLines > 200) {
      return this.slidingWindowChunk(filePath, fileName, lines, ext);
    }

    const chunks = [];

    // Semantic regex-based block detection for JavaScript/TypeScript & Python
    if (['.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.go'].includes(ext)) {
      let currentChunkLines = [];
      let startLine = 1;
      let currentSymbol = '';
      let currentType = 'block';

      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s*([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/i;
      const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/i;

      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i];

        const funcMatch = line.match(functionRegex);
        const classMatch = line.match(classRegex);

        if ((funcMatch || classMatch) && currentChunkLines.length > 5) {
          // Push previous chunk
          chunks.push({
            filePath,
            fileName,
            startLine,
            endLine: lineNum - 1,
            chunkType: currentType,
            symbolName: currentSymbol || fileName,
            content: currentChunkLines.join('\n'),
            keywords: this.extractKeywords(currentChunkLines.join('\n')),
          });
          currentChunkLines = [];
          startLine = lineNum;
        }

        if (funcMatch) {
          currentType = 'function';
          currentSymbol = funcMatch[1] || funcMatch[2] || 'anonymousFunction';
        } else if (classMatch) {
          currentType = 'class';
          currentSymbol = classMatch[1] || 'ClassDefinition';
        }

        currentChunkLines.push(line);

        // Chunk length cap (e.g. ~40 lines or block end)
        if (currentChunkLines.length >= 45) {
          chunks.push({
            filePath,
            fileName,
            startLine,
            endLine: lineNum,
            chunkType: currentType,
            symbolName: currentSymbol || `${fileName} (L${startLine}-${lineNum})`,
            content: currentChunkLines.join('\n'),
            keywords: this.extractKeywords(currentChunkLines.join('\n')),
          });
          currentChunkLines = [];
          startLine = lineNum + 1;
          currentType = 'block';
          currentSymbol = '';
        }
      }

      if (currentChunkLines.length > 0) {
        chunks.push({
          filePath,
          fileName,
          startLine,
          endLine: totalLines,
          chunkType: currentType,
          symbolName: currentSymbol || `${fileName} (L${startLine}-${totalLines})`,
          content: currentChunkLines.join('\n'),
          keywords: this.extractKeywords(currentChunkLines.join('\n')),
        });
      }
    } else {
      // Fallback sliding window chunker
      return this.slidingWindowChunk(filePath, fileName, lines, ext);
    }

    return chunks;
  },

  slidingWindowChunk(filePath, fileName, lines, ext, chunkSize = 35, overlap = 5) {
    const chunks = [];
    let start = 0;

    while (start < lines.length) {
      const end = Math.min(start + chunkSize, lines.length);
      const chunkLines = lines.slice(start, end);
      const content = chunkLines.join('\n');

      chunks.push({
        filePath,
        fileName,
        startLine: start + 1,
        endLine: end,
        chunkType: ext === '.md' ? 'documentation' : 'block',
        symbolName: `${fileName} (L${start + 1}-${end})`,
        content,
        keywords: this.extractKeywords(content),
      });

      if (end >= lines.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  },

  extractKeywords(text) {
    const cleaned = text.replace(/[^a-zA-Z0-9_$]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter((t) => t.length > 2);
    const unique = [...new Set(tokens.map((t) => t.toLowerCase()))];
    return unique.slice(0, 30);
  },
};
