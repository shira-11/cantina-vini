import re

with open('app/components/MobileCatalog.js', 'r') as f:
    content = f.read()

# 1. Add canViewFilter to props
content = content.replace('setFilters,\n  router,', 'setFilters,\n  canViewFilter,\n  router,')

# 2. Add canViewFilter checks
replacements = [
    ('Cantina Fisica', 'location'),
    ('Nazione', 'country'),
    ('Regione', 'region'),
    ('Cantina Produttrice', 'producerCellar'),
    ('Produttore</label>', 'producer'),
    ('Classificazione', 'classification'),
    ('Categoria (es. Rosso)', 'category'),
    ('Tipo Bottiglia', 'bottleType'),
    ('Disponibilità', 'availability'),
    ('Foto</label>', 'photo')
]

for label_text, filter_id in replacements:
    pattern = r'(<div>\s*<label[^>]*>(.*?)' + re.escape(label_text) + r'(.*?)</label>\s*<select.*?</select>\s*</div>)'
    
    def repl(m):
        return f"{{canViewFilter('{filter_id}') && (\n              {m.group(1)}\n            )}}"
        
    content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open('app/components/MobileCatalog.js', 'w') as f:
    f.write(content)

print("Done")
