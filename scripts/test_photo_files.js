const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

function normalize(s) {
  return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

async function main() {
  const allWines = await prisma.wine.findMany();
  const dir = 'public/uploads/wines';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  
  let matchCount = 0;
  let missing = 0;
  let matchesFound = new Set();
  
  for (const file of files) {
    let name = file.replace(/\.[^/.]+$/, ""); // Remove extension
    name = name.replace(/_/g, ' '); // Replace underscores with spaces
    
    const pdfNorm = normalize(name);
    
    const matches = allWines.filter(w => {
        const dbNorm = normalize(w.name);
        return dbNorm === pdfNorm || dbNorm.startsWith(pdfNorm) || pdfNorm.startsWith(dbNorm);
    });
    
    if (matches.length > 0) {
        matchCount++;
        for (const m of matches) {
            matchesFound.add(m.id);
        }
    } else {
        missing++;
    }
  }
  
  console.log(`Matched ${matchCount} photo files. Unmatched photo files: ${missing}.`);
  console.log(`Unique wines updated in DB: ${matchesFound.size}`);
}

main().finally(() => prisma.$disconnect());
