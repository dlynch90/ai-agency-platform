import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'scripts/starship-50-unit-testing-pipeline.mjs');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all remaining malformed console.error patterns that start with }`
content = content.replace(/} catch \(error\) \{\s*console\.error\('Error occurred:', error\);\s*throw error;\s*\}'\w+.*:', error\.message\);\s*\}/g, (match) => {
    // Extract the error message from the malformed line
    const errorMsgMatch = match.match(/}'([^']+):', error\.message\);/);
    if (errorMsgMatch) {
        return `} catch (error) {
                console.error('${errorMsgMatch[1]}:', error.message);
                throw error;
            }`;
    }
    return match; // fallback
});

// Fix lines that start with }`Failed to...
content = content.replace(/}`Failed to ([^:]+):`, error\.message\);/g, (match, errorType) => {
    return `                    console.error(\`Failed to ${errorType}:\`, error.message);`;
});

// Fix lines that start with }'❌ Evaluation failed...
content = content.replace(/}'❌ Evaluation failed:', error\.message\);/g, () => {
    return `        console.error('❌ Evaluation failed:', error.message);`;
});

fs.writeFileSync(filePath, content);
console.log('Fixed all remaining syntax errors');