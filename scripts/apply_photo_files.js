const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

function normalize(s) {
  return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

async function main() {
  const allWines = await prisma.wine.findMany();
  const dir = 'public/uploads/wines';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  
  let matchCount = 0;
  
  for (const file of files) {
    let name = file.replace(/\.[^/.]+$/, ""); // Remove extension
    name = name.replace(/_/g, ' '); 
    
    const pdfNorm = normalize(name);
    
    const matches = allWines.filter(w => {
        const dbNorm = normalize(w.name);
        
        // Exact match
        if (dbNorm === pdfNorm) return true;
        
        // Prefix match only if length is decent to avoid false positives (e.g. "a" matching "amarone")
        if (pdfNorm.length > 5 && dbNorm.length > 5) {
             return dbNorm.startsWith(pdfNorm) || pdfNorm.startsWith(dbNorm);
        }
        return false;
    });
    
    if (matches.length > 0) {
        matchCount++;
        for (const m of matches) {
            await prisma.wine.update({
                where: { id: m.id },
                data: { photo: '/uploads/wines/' + file }
            });
        }
    }
  }
  
  console.log(`Applicate le foto da ${matchCount} file immagine.`);
}

main().finally(() => prisma.$disconnect());
