const fs = require('fs');

const path = '/Users/casamilano/Downloads/VINI/app/wine/[id]/page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the modal button from header
const btnPattern = /\{unwrappedParams\.id !== 'new' && \(\s*<button className="btn" onClick=\{\(\) => setShowMovementsModal\(true\)\} style=\{\{ border: '1px solid var\(--border-color\)', background: 'white', color: 'var\(--text-color\)' \}\}>\s*📦 Giacenze e Movimenti\s*<\/button>\s*\)\}\s*/;
content = content.replace(btnPattern, '');

// 2. Extract the modal content
const modalStartStr = "{/* Movements Modal */}\n      {showMovementsModal && (\n        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>\n          <div className=\"panel\" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>";

const modalStartIndex = content.indexOf(modalStartStr);
if (modalStartIndex === -1) {
  console.log("Modal start not found");
  process.exit(1);
}

// Find the end of the modal block
// The modal ends at line 555 which is:
//               </div>
//             )}
//           </div>
//         </div>
//       )}

const modalEndStr = "              </div>\n            )}\n          </div>\n        </div>\n      )}";
const modalEndIndex = content.indexOf(modalEndStr, modalStartIndex);
if (modalEndIndex === -1) {
  console.log("Modal end not found");
  process.exit(1);
}

const modalBlock = content.substring(modalStartIndex, modalEndIndex + modalEndStr.length);

// 3. Remove the modal block from its original position
content = content.replace(modalBlock, '');

// 4. Modify the modal block to be a regular panel instead of a fixed modal
let newModalBlock = modalBlock;

// Remove the outer fixed div and the {showMovementsModal && ( ... )} wrapper
newModalBlock = newModalBlock.replace("{/* Movements Modal */}\n      {showMovementsModal && (\n        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>", 
"{/* Movements Panel (Bottom) */}\n      {unwrappedParams.id !== 'new' && (\n        <div style={{ padding: '0 2rem 2rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>");

newModalBlock = newModalBlock.replace("          <div className=\"panel\" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>",
"          <div className=\"panel\" style={{ width: '100%', position: 'relative' }}>");

// Remove the close button
const closeBtnStr = "            <button \n              onClick={() => setShowMovementsModal(false)}\n              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}\n            >\n              &times;\n            </button>\n";
newModalBlock = newModalBlock.replace(closeBtnStr, '');

// Update the end wrappers
const oldEndWrappers = "              </div>\n            )}\n          </div>\n        </div>\n      )}";
const newEndWrappers = "              </div>\n            )}\n          </div>\n        </div>\n      )}"; // Actually the same number of closing divs, because we replaced 2 divs with 2 divs!

// 5. Insert the new modal block at the bottom of the page, right before the final </div> of the page.
const lastDivIndex = content.lastIndexOf("</div>\n  );");
if (lastDivIndex === -1) {
  console.log("Last div not found");
  process.exit(1);
}

content = content.substring(0, lastDivIndex) + newModalBlock + "\n    " + content.substring(lastDivIndex);

fs.writeFileSync(path, content);
console.log("Done");
