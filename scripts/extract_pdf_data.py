import fitz
import json
import os
import re
from PIL import Image
import io
import shutil

def clean_price(price_str):
    if not price_str:
        return 0.0
    price_str = price_str.replace('€', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(price_str)
    except:
        return 0.0

def clean_qty(qty_str):
    if not qty_str:
        return 0
    try:
        return int(qty_str)
    except:
        return 0

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

def extract_pdf(pdf_path, output_json):
    os.makedirs('public/uploads/wines', exist_ok=True)
    doc = fitz.open(pdf_path)
    
    # --- 1. PARSE INDEX FOR REGIONS ---
    print("Parsing index for regions...")
    regions_map = {} 
    categories_map = {}
    
    known_regions = ["Francia", "Champagne", "Bordeaux", "Bourgogne", "Còtes du Rhonè", "Còtes Du Rhonè", "Loire"]
    known_categories = ["Bianco", "Rosso", "Passito", "Champagne"]
    
    for p in range(37, 52): 
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
                if name in known_categories:
                    categories_map[page_num] = name

    page_to_meta = {}
    last_r = ""
    last_c = ""
    for i in range(1, 400):
        if i in regions_map:
            last_r = regions_map[i]
        if i in categories_map:
            last_c = categories_map[i]
        page_to_meta[i] = {"region": last_r, "category": last_c}

    # --- 2. PARSE WINE CARDS ---
    results = []
    last_known_region = ""
    last_known_category = ""
    
    for page_num in range(52, len(doc)):
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
            if is_card:
                break
                
        if not is_card:
            continue
            
        blocks = page.get_text("blocks")
        if len(blocks) < 4:
            continue
            
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
        
        if "Data Inventario" in producer:
             producer = producer.split("Data Inventario")[0].strip()
        
        grape_varieties_text = blocks[2][4].strip()
        if "Data Inventario" in grape_varieties_text:
            grape_varieties_text = ""
            
        grapes = parse_grape_varieties(grape_varieties_text)
        
        meta = page_to_meta.get(printed_page, {"region": last_known_region, "category": last_known_category})
        region = meta["region"] if meta["region"] else last_known_region
        category = meta["category"] if meta["category"] else last_known_category
        
        if region:
            last_known_region = region
        if category:
            last_known_category = category
            
        # Dynamically discover locations
        location_cols = {}
        # row 0 usually has locations, row 1 has "Disp."
        row_disp = df[annata_row_idx]
        row_locs = df[max(0, annata_row_idx - 1)]
        
        for c_idx, cell in enumerate(row_disp):
            if cell and cell.strip() == "Disp.":
                loc_name = row_locs[c_idx]
                if loc_name:
                    loc_name = loc_name.strip()
                    location_cols[f"Cantina {loc_name}"] = c_idx
                    
        # Extract images and stitch
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
                except:
                    pass
            
            if pil_images:
                width = pil_images[0].width
                total_height = sum(img.height for img in pil_images)
                stitched = Image.new('RGB', (width, total_height))
                y_offset = 0
                for img in reversed(pil_images):
                    stitched.paste(img, (0, y_offset))
                    y_offset += img.height
                
                stitched.save(image_full_path, format="JPEG", quality=90)
        
        vintages = []
        for row in df[annata_row_idx+1:]:
            if not row[annata_col] or not row[annata_col].strip().isdigit():
                continue
                
            annata = row[annata_col].strip()
            prezzo = clean_price(row[annata_col + 1]) if len(row) > annata_col + 1 else 0.0
            
            loc_qtys = {}
            for loc_name, col_idx in location_cols.items():
                loc_qtys[loc_name] = clean_qty(row[col_idx]) if len(row) > col_idx else 0
            
            vintages.append({
                "year": annata,
                "price": prezzo,
                "locations": loc_qtys
            })
            
        results.append({
            "name": wine_name,
            "producer": producer,
            "classification": classification,
            "grapeVarieties": grapes,
            "photo": image_path,
            "region": region,
            "category": category,
            "vintages": vintages
        })
        
        print(f"Processed: {wine_name} ({len(vintages)} vintages) | Locs: {list(location_cols.keys())}")

    with open(output_json, 'w') as f:
        json.dump(results, f, indent=2)
        
    print(f"Extraction complete! Found {len(results)} wine cards.")

if __name__ == "__main__":
    extract_pdf("vini_francia_arezzo.pdf", "wines_data_v5.json")
