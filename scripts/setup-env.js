const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const copies = [
  {
    src: path.join(rootDir, 'backend', '.env.example'),
    dest: path.join(rootDir, 'backend', '.env'),
  },
  {
    src: path.join(rootDir, 'frontend', '.env.example'),
    dest: path.join(rootDir, 'frontend', '.env.local'),
  },
  {
    src: path.join(rootDir, 'frontend', '.env.example'),
    dest: path.join(rootDir, 'frontend', '.env'),
  },
  {
    src: path.join(rootDir, 'database', '.env.example'),
    dest: path.join(rootDir, 'database', '.env'),
  },
];

console.log('\n========================================');
console.log('  CarePath+ Automated Setup');
console.log('========================================\n');

let createdCount = 0;
for (const { src, dest } of copies) {
  const relDest = path.relative(rootDir, dest);
  if (!fs.existsSync(dest)) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  [CREATED] ${relDest}`);
      createdCount++;
    } else {
      console.warn(`  [WARNING] Template not found: ${src}`);
    }
  } else {
    console.log(`  [EXISTS]  ${relDest}`);
  }
}

console.log(`\n  Environment configuration complete! (${createdCount} files created)\n`);
