const fs = require('fs');
const file = 'app/wine/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [promptDialog, setPromptDialog]')) {
  content = content.replace(/const \[confirmDialog, setConfirmDialog\] = useState\(null\);/, `const [confirmDialog, setConfirmDialog] = useState(null);\n  const [promptDialog, setPromptDialog] = useState(null);`);
}

const promptModalHtml = `
      {promptDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
            maxWidth: '90vw', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.25rem', fontWeight: 'bold' }}>Inserisci dati</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '16px', lineHeight: '1.5' }}>
              {promptDialog.message}
            </p>
            <input 
              type="text" 
              autoFocus
              className="form-control" 
              style={{ width: '100%', marginBottom: '24px', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value;
                  const action = promptDialog.onConfirm;
                  setPromptDialog(null);
                  action(val);
                }
              }}
              ref={(input) => {
                if (input && !input.value) {
                  // Only set default value once
                  if (promptDialog.defaultValue) {
                    input.value = promptDialog.defaultValue;
                  }
                }
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPromptDialog(null)}
              >
                Annulla
              </button>
              <button 
                className="btn btn-primary" 
                onClick={(e) => {
                  const val = e.target.parentElement.previousElementSibling.value;
                  const action = promptDialog.onConfirm;
                  setPromptDialog(null);
                  action(val);
                }}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('promptDialog &&')) {
  content = content.replace(/      \{confirmDialog && \(/, promptModalHtml + '      {confirmDialog && (');
}

fs.writeFileSync(file, content);
console.log('Fixed prompt state and modal in wine page.');
