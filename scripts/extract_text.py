import fitz
import sys

def extract_text(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        print(f"Total Pages: {len(doc)}")
        
        # Extract text from page 1
        page = doc[0]
        text = page.get_text()
        print(f"--- Text on Page 1 ---")
        print(text)
        print(f"----------------------")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text("vini_francia_arezzo.pdf")
