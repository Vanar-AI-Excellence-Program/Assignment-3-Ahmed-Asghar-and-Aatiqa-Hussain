export interface ParsedBlock {
  type: 'text' | 'code' | 'table';
  content: string;
  language?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

/**
 * Parse markdown content and separate text from code blocks and tables
 * @param markdown - The markdown content to parse
 * @returns Array of parsed blocks (text, code, or table)
 */
export function parseMarkdown(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  
  // Split by code block delimiters (```)
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith('```')) {
      // This is a code block
      const codeContent = part.slice(3, -3); // Remove ``` from start and end
      const lines = codeContent.split('\n');
      
      // Extract language from first line
      const firstLine = lines[0].trim();
      let language = '';
      let code = codeContent;
      
      // Check if first line contains language identifier
      if (firstLine && !firstLine.includes(' ') && !firstLine.includes('\t')) {
        language = firstLine;
        code = lines.slice(1).join('\n');
      }
      
      blocks.push({
        type: 'code',
        content: code.trim(),
        language: language || undefined
      });
    } else if (part.trim()) {
      // Check if this part contains tables
      const tableBlocks = parseTables(part);
      if (tableBlocks.length > 0) {
        blocks.push(...tableBlocks);
      } else {
        // This is regular text content
        blocks.push({
          type: 'text',
          content: part
        });
      }
    }
  }
  
  return blocks;
}

/**
 * Parse tables from markdown text
 * @param text - Text that may contain tables
 * @returns Array of parsed blocks (text and table)
 */
function parseTables(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  
  // Table regex pattern: matches | header1 | header2 | header3 |
  // followed by | --- | --- | --- | (separator row)
  // followed by | data1 | data2 | data3 | (data rows)
  const tableRegex = /(\|[^\n]*\|[\s\S]*?)(?=\n\n|\n[^|]|$)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = tableRegex.exec(text)) !== null) {
    const tableText = match[0];
    const tableStart = match.index;
    
    // Add text before table
    if (tableStart > lastIndex) {
      const beforeText = text.slice(lastIndex, tableStart).trim();
      if (beforeText) {
        blocks.push({
          type: 'text',
          content: beforeText
        });
      }
    }
    
    // Parse the table
    const tableData = parseTableStructure(tableText);
    if (tableData) {
      blocks.push({
        type: 'table',
        content: tableText,
        tableData
      });
    } else {
      // If table parsing fails, treat as text
      blocks.push({
        type: 'text',
        content: tableText
      });
    }
    
    lastIndex = tableRegex.lastIndex;
  }
  
  // Add remaining text after last table
  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex).trim();
    if (afterText) {
      blocks.push({
        type: 'text',
        content: afterText
      });
    }
  }
  
  return blocks;
}

/**
 * Parse table structure from markdown table text
 * @param tableText - Raw table markdown text
 * @returns Parsed table data or null if invalid
 */
function parseTableStructure(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return null;
  
  // Parse headers (first line)
  const headerLine = lines[0];
  const headers = parseTableRow(headerLine);
  
  if (!headers || headers.length === 0) return null;
  
  // Skip separator line (second line with | --- | --- |)
  const dataLines = lines.slice(2);
  const rows: string[][] = [];
  
  for (const line of dataLines) {
    const row = parseTableRow(line);
    if (row && row.length === headers.length) {
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

/**
 * Parse a single table row
 * @param rowText - Raw row text
 * @returns Array of cell contents
 */
function parseTableRow(rowText: string): string[] | null {
  // Remove leading/trailing | and split by |
  const cells = rowText.trim().split('|').slice(1, -1);
  
  if (cells.length === 0) return null;
  
  return cells.map(cell => cell.trim());
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  // Basic HTML entity decoding
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Remove potentially dangerous HTML tags and attributes
  return decoded
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

/**
 * Convert markdown text to HTML with basic formatting
 * @param text - Markdown text to convert
 * @returns HTML string
 */
export function markdownToHTML(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="markdown-em">$1</em>')
    .replace(/__(.*?)__/g, '<strong class="markdown-strong">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="markdown-em">$1</em>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="markdown-list-item">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="markdown-list-item">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="markdown-list-item">$1</li>')
    
    // Wrap lists
    .replace(/(<li class="markdown-list-item">.*<\/li>)/gs, '<ul class="markdown-list">$1</ul>')
    
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="markdown-blockquote">$1</blockquote>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p class="markdown-paragraph">')
    .replace(/\n/g, '<br>')
    
    // Wrap in paragraph tags
    .replace(/^(?!<[h|u|o|b|li])(.*)$/gim, '<p class="markdown-paragraph">$1</p>')
    
    // Clean up empty paragraphs
    .replace(/<p class="markdown-paragraph"><\/p>/g, '')
    .replace(/<p class="markdown-paragraph"><br><\/p>/g, '');
}

/**
 * Convert table data to HTML
 * @param tableData - Parsed table data
 * @returns HTML string for the table
 */
export function tableToHTML(tableData: { headers: string[]; rows: string[][] }): string {
  const { headers, rows } = tableData;
  
  let html = '<div class="table-container"><table class="markdown-table">';
  
  // Add header row
  html += '<thead><tr>';
  for (const header of headers) {
    // Process markdown formatting in header cells
    const processedHeader = processTableCellMarkdown(header);
    html += `<th class="markdown-th">${processedHeader}</th>`;
  }
  html += '</tr></thead>';
  
  // Add data rows
  html += '<tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (const cell of row) {
      // Process markdown formatting in data cells
      const processedCell = processTableCellMarkdown(cell);
      html += `<td class="markdown-td">${processedCell}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  
  html += '</table></div>';
  
  return html;
}

/**
 * Process markdown formatting within table cells
 * @param cellContent - Raw cell content
 * @returns Processed HTML content
 */
function processTableCellMarkdown(cellContent: string): string {
  return cellContent
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="markdown-em">$1</em>')
    .replace(/__(.*?)__/g, '<strong class="markdown-strong">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="markdown-em">$1</em>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');
}
