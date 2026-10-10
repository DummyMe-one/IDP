/**
 * .env file parser
 * Handles comments, empty lines, quoted values, duplicate names, and invalid entries.
 */

export interface ParsedEnvEntry {
  name: string;
  value: string;
  line: number;
  isValid: boolean;
  error?: string;
}

export interface ParseResult {
  entries: ParsedEnvEntry[];
  validCount: number;
  invalidCount: number;
  duplicates: string[];
  errors: string[];
}

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function parseEnvFile(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const entries: ParsedEnvEntry[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Check for export prefix
    const cleanedLine = line.startsWith('export ') ? line.slice(7).trim() : line;

    // Find the = separator
    const eqIndex = cleanedLine.indexOf('=');
    if (eqIndex === -1) {
      errors.push(`Line ${lineNum}: Missing '=' separator`);
      entries.push({ name: cleanedLine, value: '', line: lineNum, isValid: false, error: 'Missing separator' });
      continue;
    }

    const name = cleanedLine.slice(0, eqIndex).trim();
    let value = cleanedLine.slice(eqIndex + 1).trim();

    // Validate name
    if (!VALID_NAME_REGEX.test(name)) {
      errors.push(`Line ${lineNum}: Invalid variable name "${name}"`);
      entries.push({ name, value: '', line: lineNum, isValid: false, error: 'Invalid name' });
      continue;
    }

    // Check for duplicates
    if (seen.has(name)) {
      duplicates.push(name);
      errors.push(`Line ${lineNum}: Duplicate variable "${name}"`);
      entries.push({ name, value: '', line: lineNum, isValid: false, error: 'Duplicate' });
      continue;
    }

    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      // Unescape double-quoted strings
      if (value.includes('\\')) {
        value = value.replace(/\\n/g, '\n')
                     .replace(/\\t/g, '\t')
                     .replace(/\\r/g, '\r')
                     .replace(/\\"/g, '"')
                     .replace(/\\\\/g, '\\');
      }
    }

    // Handle inline comments (only for unquoted values)
    if (!cleanedLine.slice(eqIndex + 1).trim().startsWith('"') && 
        !cleanedLine.slice(eqIndex + 1).trim().startsWith("'")) {
      const commentIndex = value.indexOf(' #');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    seen.add(name);
    entries.push({ name, value, line: lineNum, isValid: true });
  }

  return {
    entries,
    validCount: entries.filter(e => e.isValid).length,
    invalidCount: entries.filter(e => !e.isValid).length,
    duplicates,
    errors,
  };
}

export function generateEnvFile(entries: { name: string; value: string }[]): string {
  return entries
    .map(e => {
      // Quote values that contain spaces, newlines, or special characters
      if (e.value.includes(' ') || e.value.includes('\n') || e.value.includes('#') || 
          e.value.includes('"') || e.value.includes("'")) {
        const escaped = e.value
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `${e.name}="${escaped}"`;
      }
      return `${e.name}=${e.value}`;
    })
    .join('\n');
}

export function downloadEnvFile(content: string, filename: string = '.env') {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
