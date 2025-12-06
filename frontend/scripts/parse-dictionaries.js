import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../instrukcja');
const outputDir = path.join(__dirname, '../src/data/generated');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n').map(l => l.trim());

// Data holders
const parts = [];
const sections = [];
const chapters = [];
const paragraphs = [];
const taskBudget = [];

// Regex patterns
const partRegex = /^(\d{2})\s+(.+)$/;
const sectionRegex = /^(\d{3})\s+(.+)$/;

// Parsing Logic
let isParsingParts = false;
let isParsingSections = false;
let isParsingParagraphs = false;
let isParsingTaskBudget = false;

// 1. Parse Parts and Sections (Line by line)
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('Słownik: Część budżetowa')) {
        isParsingParts = true;
        isParsingSections = false;
        continue;
    } else if (line.includes('Słownik: Dział')) {
        isParsingParts = false;
        isParsingSections = true;
        continue;
    } else if (line.trim() === '[' && lines[i + 1] && lines[i + 1].includes('{ "value":')) {
        // This is the start of the chapters JSON block
        isParsingSections = false;
        isParsingParts = false;
        // Extract everything from here until closing bracket
        let jsonBuffer = '';
        let j = i;
        while (j < lines.length) {
            jsonBuffer += lines[j] + '\n';
            if (lines[j].trim() === ']') break;
            j++;
        }
        try {
            // Fix potential JSON formatting issues (like trailing commas)
            const parsedChapters = JSON.parse(jsonBuffer);
            chapters.push(...parsedChapters.map(c => ({
                code: c.value,
                name: c.label,
                parentSection: c.parentSection
            })));
            console.log(`Parsed ${chapters.length} chapters.`);
        } catch (e) {
            console.error('Error parsing chapters block:', e);
        }
        i = j; // Skip consumed lines
        continue;
    } else if (line.includes('Paragrafy')) {
        isParsingParts = false;
        isParsingSections = false;
        isParsingParagraphs = true;
        isParsingTaskBudget = false;
        continue;
    } else if (line.includes('Katalog funkcji państwa')) {
        isParsingParts = false;
        isParsingSections = false;
        isParsingParagraphs = false;
        isParsingTaskBudget = true;
        continue;
    }

    // Process lines based on mode
    if (isParsingParts) {
        const match = line.match(partRegex);
        if (match) {
            parts.push({ code: match[1], name: match[2].trim() });
        }
    } else if (isParsingSections) {
        const match = line.match(sectionRegex);
        if (match) {
            sections.push({ code: match[1], name: match[2].trim() });
        }
    } else if (isParsingParagraphs) {
        if (line.length > 3 && !isNaN(parseInt(line.substring(0, 3)))) {
            const code = line.substring(0, 3);
            const name = line.substring(3).trim();
            paragraphs.push({ code, name });
        }
    } else if (isParsingTaskBudget) {
        // Basic regex to find code starting with digit and then name
        // Examples: "1. Zarządzanie...", "1.1. Obsługa..."
        // Sometimes there might be a dot at the end of code or not.
        // The file seems to have "1.Zarządzanie" (no space) or "1.1.Obsługa".
        const taskMatch = line.match(/^(\d+(?:\.\d+)*)\.?\s*(.+)$/);
        if (taskMatch) {
            const code = taskMatch[1];
            let name = taskMatch[2].trim();

            // Filter out artifacts like "Strona 1 z 23" or headers if they match
            if (line.includes('Strona') || line.includes('Wersja z')) continue;

            const level = code.split('.').length;
            let parent = undefined;
            if (level > 1) {
                parent = code.substring(0, code.lastIndexOf('.'));
            }

            taskBudget.push({
                code,
                name,
                level,
                parent
            });
        }
    }
}

// Save to files
fs.writeFileSync(path.join(outputDir, 'parts.json'), JSON.stringify(parts, null, 2));
fs.writeFileSync(path.join(outputDir, 'sections.json'), JSON.stringify(sections, null, 2));
fs.writeFileSync(path.join(outputDir, 'chapters.json'), JSON.stringify(chapters, null, 2));
fs.writeFileSync(path.join(outputDir, 'paragraphs.json'), JSON.stringify(paragraphs, null, 2));
fs.writeFileSync(path.join(outputDir, 'taskBudget.json'), JSON.stringify(taskBudget, null, 2));

console.log('Dictionaries generated successfully!');
console.log(`Parts: ${parts.length}`);
console.log(`Sections: ${sections.length}`);
console.log(`Chapters: ${chapters.length}`);
console.log(`Paragraphs: ${paragraphs.length}`);
console.log(`Task Budget Items: ${taskBudget.length}`);
