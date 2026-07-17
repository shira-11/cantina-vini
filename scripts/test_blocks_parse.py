import fitz

def parse_blocks(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    blocks = page.get_text("blocks")
    for b in blocks:
        print(f"Block: {b[4]}")
        print("---")

if __name__ == "__main__":
    parse_blocks("vini_francia_arezzo.pdf", 100)
