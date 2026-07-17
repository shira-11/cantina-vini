const fs = require('fs');
const file = 'app/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add the state
if (!content.includes('const [confirmDialog, setConfirmDialog]')) {
  content = content.replace(/const \[toastMessage, setToastMessage\] = useState\(''\);/, `const [toastMessage, setToastMessage] = useState('');\n  const [confirmDialog, setConfirmDialog] = useState(null);`);
}

// 2. Add the modal JSX at the very end
const confirmModalHtml = `
      {confirmDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
            maxWidth: '90vw', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.25rem', fontWeight: 'bold' }}>Conferma</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmDialog(null)}
              >
                Annulla
              </button>
              <button 
                className="btn btn-primary" 
                style={confirmDialog.isDanger ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : {}}
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  action();
                }}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('confirmDialog &&')) {
  content = content.replace(/    <\/div>\n  \);\n\}\n?$/, confirmModalHtml + '    </div>\n  );\n}\n');
}

fs.writeFileSync(file, content);
console.log('Fixed state and modal.');
