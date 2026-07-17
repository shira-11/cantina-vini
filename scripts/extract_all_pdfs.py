import fitz
import json
import os
import re
import io
import time
from PIL import Image

def clean_price(price_str):
    if not price_str: return 0.0
    p = price_str.replace('€', '').replace(' ', '').replace('.', '').replace(',', '.')
    try: return float(p)
    except: return 0.0

def clean_qty(qty_str):
    if not qty_str: return 0
    try: return int(qty_str)
    except: return 0

def parse_grape_varieties(text):
    varieties = []
    matches = re.finditer(r'(\d+(?:[.,]\d+)?)%\s*([^%0-9]+)', text)
    found_any = False
    for m in matches:
        found_any = True
        perc = float(m.group(1).replace(',', '.'))
        name = m.group(2).strip()
        if "Annata" not in name and "Prezzo" not in name:
            varieties.append({"name": name, "percentage": perc})
    if not found_any and text and text.strip() != "":
        if "Annata" not in text and "Prezzo" not in text:
            varieties.append({"name": text.strip(), "percentage": 100.0})
    return varieties

def infer_country(filename):
    lower = filename.lower()
    if 'francia' in lower: return 'Francia'
    if 'italia' in lower: return 'Italia'
    if 'spagna' in lower: return 'Spagna'
    if 'austria' in lower: return 'Austria'
    if 'germania' in lower: return 'Germania'
    if 'argentina' in lower: return 'Argentina'
    if 'nuova zelanda' in lower: return 'Nuova Zelanda'
    if 'usa' in lower: return 'USA'
    return ''

def process_pdf(pdf_path, output_json):
    filename = os.path.basename(pdf_path)
    default_region = infer_country(filename)
    print(f"--- Processing {filename} (Default Region: {default_region}) ---")
    
    doc = fitz.open(pdf_path)
    results = []
    
    known_regions = ["Francia", "Champagne", "Bordeaux", "Bourgogne", "Còtes du Rhonè", "Còtes Du Rhonè", "Loire", "Piemonte", "Toscana", "Veneto", "Friuli", "Trentino", "Alto Adige", "Sicilia", "Sardegna", "Campania", "Puglia", "Umbria", "Marche", "Lombardia", "Valle d'Aosta", "Liguria", "Emilia Romagna", "Calabria", "Basilicata", "Abruzzo", "Molise"]
    
    regions_map = {}
    for p in range(min(100, len(doc))):
        page = doc[p]
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            lines = text.split('\n')
            if len(lines) >= 2 and lines[-1].isdigit():
                name = " ".join(lines[:-1]).strip()
                page_num = int(lines[-1])
                if name in known_regions:
                    regions_map[page_num] = name
                    
    page_to_meta = {}
    last_r = ""
    for i in range(1, 1000):
        if i in regions_map:
            last_r = regions_map[i]
        page_to_meta[i] = last_r
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        tabs = page.find_tables()
        if not tabs.tables:
            continue
            
        tab = tabs.tables[0]
        df = tab.extract()
        
        is_card = False
        annata_row_idx = -1
        annata_col = -1
        for r_idx, row in enumerate(df[:3]):
            for col_idx, cell in enumerate(row):
                if cell and "Annata" in cell:
                    is_card = True
                    annata_col = col_idx
                    annata_row_idx = r_idx
                    break
            if is_card: break
                
        if not is_card: continue
            
        blocks = page.get_text("blocks")
        if len(blocks) < 4: continue
            
        printed_page = -1
        try:
            last_block_text = blocks[-1][4].strip()
            page_str = last_block_text.split('\n')[0]
            page_str = ''.join(c for c in page_str if c.isdigit())
            if page_str:
                printed_page = int(page_str)
        except:
            pass
            
        wine_name = blocks[0][4].strip()
        producer_class = blocks[1][4].strip().split(' - ')
        producer = producer_class[0].strip() if len(producer_class) > 0 else ""
        classification = producer_class[1].strip() if len(producer_class) > 1 else ""
        
        if "Data Inventario" in producer: producer = producer.split("Data Inventario")[0].strip()
        
        grape_varieties_text = blocks[2][4].strip()
        if "Data Inventario" in grape_varieties_text: grape_varieties_text = ""
            
        grapes = parse_grape_varieties(grape_varieties_text)
        
        location_cols = {}
        tipo_col = -1
        row_disp = df[annata_row_idx]
        row_locs = df[max(0, annata_row_idx - 1)]
        
        for c_idx, cell in enumerate(row_disp):
            if cell and "Tipo" in cell:
                tipo_col = c_idx
            if cell and cell.strip() == "Disp.":
                loc_name = row_locs[c_idx]
                if loc_name:
                    loc_name = loc_name.strip()
                    location_cols[f"Cantina {loc_name}"] = c_idx
                    
        wine_name_safe = re.sub(r'[^a-zA-Z0-9_\-]', '_', wine_name)
        image_name = f"{wine_name_safe}.jpg"
        image_path = f"/uploads/wines/{image_name}"
        image_full_path = f"public{image_path}"
        
        images = page.get_images()
        if len(images) > 0 and not os.path.exists(image_full_path):
            pil_images = []
            for img in images:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                try:
                    pil_img = Image.open(io.BytesIO(image_bytes))
                    pil_images.append(pil_img)
                except: pass
            
            if pil_images:
                width = pil_images[0].width
                total_height = sum(img.height for img in pil_images)
                stitched = Image.new('RGB', (width, total_height))
                y_offset = 0
                for img in reversed(pil_images):
                    stitched.paste(img, (0, y_offset))
                    y_offset += img.height
                try:
                    stitched.save(image_full_path, format="JPEG", quality=85)
                except:
                    pass
        
        vintages = []
        for row in df[annata_row_idx+1:]:
            if not row[annata_col] or not row[annata_col].strip().isdigit(): continue
                
            annata = row[annata_col].strip()
            prezzo = clean_price(row[annata_col + 1]) if len(row) > annata_col + 1 else 0.0
            
            tipo = "0,75 L"
            if tipo_col != -1 and len(row) > tipo_col and row[tipo_col]:
                val = row[tipo_col].strip()
                if val:
                    tipo = f"{val} L" if "L" not in val.upper() else val
            
            loc_qtys = {}
            for loc_name, col_idx in location_cols.items():
                loc_qtys[loc_name] = clean_qty(row[col_idx]) if len(row) > col_idx else 0
            
            vintages.append({
                "year": annata,
                "price": prezzo,
                "bottleType": tipo,
                "locations": loc_qtys
            })
            
        parsed_region = page_to_meta.get(printed_page, "")
        final_region = parsed_region if parsed_region else default_region

        results.append({
            "name": wine_name,
            "producer": producer,
            "classification": classification,
            "grapeVarieties": grapes,
            "photo": image_path,
            "region": final_region,
            "category": "",
            "vintages": vintages
        })
        
    with open(output_json, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"-> Extracted {len(results)} wines from {filename} into {output_json}")

def main():
    os.makedirs('public/uploads/wines', exist_ok=True)
    pdf_dir = "Vini PDF/Completati"
    out_dir = "Vini PDF/parsed_data"
    os.makedirs(out_dir, exist_ok=True)
    
    pdfs = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    print(f"Found {len(pdfs)} PDFs to process.")
    
    for pdf_file in pdfs:
        pdf_path = os.path.join(pdf_dir, pdf_file)
        out_json = os.path.join(out_dir, pdf_file.replace('.pdf', '.json'))
        process_pdf(pdf_path, out_json)

if __name__ == "__main__":
    main()
