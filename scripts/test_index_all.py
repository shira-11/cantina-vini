import fitz
import sys
import os

pdf_dir = "Vini PDF/Completati"
pdfs = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]

known_regions = ["Francia", "Champagne", "Bordeaux", "Bourgogne", "Còtes du Rhonè", "Còtes Du Rhonè", "Loire", "Piemonte", "Toscana", "Veneto", "Friuli", "Trentino", "Alto Adige", "Sicilia", "Sardegna", "Campania", "Puglia", "Umbria", "Marche", "Lombardia", "Valle d'Aosta", "Liguria", "Emilia Romagna", "Calabria", "Basilicata", "Abruzzo", "Molise"]

for pdf_file in pdfs:
    doc = fitz.open(os.path.join(pdf_dir, pdf_file))
    print(f"--- Index for {pdf_file} ---")
    
    # scan first 100 pages for index-like lines
    regions_found = set()
    for p in range(min(100, len(doc))):
        page = doc[p]
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            lines = text.split('\n')
            if len(lines) >= 2 and lines[-1].isdigit():
                name = " ".join(lines[:-1]).strip()
                if name in known_regions or name.isupper():
                    regions_found.add(name)
    print(f"Found regions: {regions_found}")
