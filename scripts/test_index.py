import fitz

def parse_index(pdf_path):
    doc = fitz.open(pdf_path)
    # Index pages are roughly from 38 to 51
    categories = []
    
    for p in range(37, 52): # Pages 38 to 52
        page = doc[p]
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            # If it's a category/wine line, it usually ends with a number
            lines = text.split('\n')
            if len(lines) >= 2 and lines[-1].isdigit():
                name = " ".join(lines[:-1]).strip()
                page_num = int(lines[-1])
                # Skip if it's a wine name (contains '-')
                if " - " not in name:
                    categories.append((page_num, name))
                    
    # Sort categories by page number
    categories.sort(key=lambda x: x[0])
    
    # Let's print them out to see
    current_page = -1
    for p, name in categories:
        if p != current_page:
            print(f"--- Page {p} ---")
            current_page = p
        print(f"  {name}")

if __name__ == "__main__":
    parse_index("vini_francia_arezzo.pdf")
