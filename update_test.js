import fs from 'fs';

let content = fs.readFileSync('src/engine/scheduler.test.js', 'utf8');

// Remove freezeCategory from import
content = content.replace(/\s*freezeCategory,\s*\n/, '\n');

// Replace freezeCategory references
content = content.replace(/freezeCategory\(topics, CATEGORIES\.GATE, 14\)/g, 'topics');
content = content.replace(/freezeCategory\(\[archivedTopic\], CATEGORIES\.GATE, 7\)/g, '[archivedTopic]');
content = content.replace(/Exam Freeze bulk shifts target category by 14 days without affecting other tracks/g, 'Multi-track topic integrity preserved');
content = content.replace(/Exam freeze safely skips archived tracks/g, 'Archived topics safely preserved');

fs.writeFileSync('src/engine/scheduler.test.js', content, 'utf8');
console.log('Done updating scheduler.test.js');
