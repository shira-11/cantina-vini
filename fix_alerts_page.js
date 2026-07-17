const fs = require('fs');
const file = 'app/page.js';
let content = fs.readFileSync(file, 'utf8');

// First check if toast is already injected
if (!content.includes('const [toastMessage, setToastMessage]')) {
  content = content.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);\n  const [toastMessage, setToastMessage] = useState('');\n  const customAlert = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };`);
  
  content = content.replace(/alert\(/g, 'customAlert(');

  const toastHtml = `
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000,
          fontWeight: '500', fontSize: '1rem', textAlign: 'center', maxWidth: '90vw'
        }}>
          {toastMessage.replace(/\\n/g, '')}
        </div>
      )}
    </div>
  );
}`;

  content = content.replace(/    <\/div>\n  \);\n\}\n?$/g, toastHtml + '\n');
  fs.writeFileSync(file, content);
  console.log('Fixed alerts in home page.');
} else {
  console.log('Already fixed.');
}
