import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'scripts/starship-50-unit-testing-pipeline.mjs');
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines for easier processing
const lines = content.split('\n');
const fixedLines = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i];

    // Check for malformed console.error lines that start with }`
    if (line.trim().startsWith('}`') && line.includes('error.message);')) {
        // Skip this malformed line
        i++;
        continue;
    }

    // Check for malformed console.error lines that start with }''
    if (line.trim().startsWith("}'") && line.includes('error.message);')) {
        // Skip this malformed line
        i++;
        continue;
    }

    // Check for duplicate throw error lines
    if (line.trim() === 'throw error;' && fixedLines.length > 0 && fixedLines[fixedLines.length - 1].trim() === 'throw error;') {
        // Skip duplicate throw error
        i++;
        continue;
    }

    // Check for malformed catch blocks
    if (line.includes('} catch (error) {') && lines[i + 1] && lines[i + 1].includes("console.error('Error occurred:', error);")) {
        // This is a malformed catch block, skip the next few lines and replace with proper format
        fixedLines.push('                } catch (error) {');
        // Find the proper console.error line
        let j = i + 2;
        while (j < lines.length) {
            if (lines[j].includes('console.error(`Failed to')) {
                const match = lines[j].match(/console\.error\(`([^`]+):`, error\.message\);/);
                if (match) {
                    fixedLines.push(`                    console.error(\`${match[1]}:\`, error.message);`);
                    fixedLines.push('                    throw error;');
                    fixedLines.push('                }');
                    break;
                }
            }
            j++;
        }
        // Skip to after the malformed block
        while (i < lines.length && !lines[i].includes('}')) {
            i++;
        }
        i++;
        continue;
    }

    fixedLines.push(line);
    i++;
}

// Join back and fix any remaining issues
let fixedContent = fixedLines.join('\n');

// Remove any remaining malformed patterns
fixedContent = fixedContent.replace(/^\s*} catch \(error\) \{\s*console\.error\('Error occurred:', error\);\s*throw error;\s*\}\s*$/gm, '');
fixedContent = fixedContent.replace(/^\s*throw error;\s*$/gm, '', (match, offset, string) => {
    // Only remove duplicate throw error lines
    const before = string.substring(0, offset);
    const after = string.substring(offset + match.length);
    if (before.endsWith('throw error;\n') || after.startsWith('\nthrow error;')) {
        return '';
    }
    return match;
});

fs.writeFileSync(filePath, fixedContent);
console.log('Comprehensive syntax fix completed');