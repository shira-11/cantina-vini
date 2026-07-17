const fs = require('fs');
const file = 'app/wine/[id]/page.js';
const lines = fs.readFileSync(file, 'utf-8').split('\n');

// Find start of Movements Panel
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Movements Panel (Bottom) */}')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  // Find where it ends. It's right before `    </div>` at the end of the file.
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].trim() === ');') {
      endIdx = i - 1; // Before </div>
      break;
    }
  }

  if (endIdx !== -1) {
    const panelLines = lines.splice(startIdx, endIdx - startIdx + 1);
    
    // Now find the insertion point
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<main style={{ padding: \'2rem\', maxWidth: \'1400px\', margin: \'0 auto\' }}>')) {
        insertIdx = i + 1;
        break;
      }
    }
    
    if (insertIdx !== -1) {
      lines.splice(insertIdx, 0, ...panelLines);
      fs.writeFileSync(file, lines.join('\n'));
      console.log('Moved panel successfully');
    } else {
      console.log('Insert index not found');
    }
  } else {
    console.log('End index not found');
  }
} else {
  console.log('Start index not found');
}
