import fitz
import sys

def extract_page_info(pdf_path, page_num):
    try:
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        
        # Check text
        text = page.get_text()
        print(f"--- Text on Page {page_num + 1} ---")
        print(text[:1000]) # Print first 1000 chars
        print(f"----------------------")
        
        # Check images
        images = page.get_images()
        print(f"Images on Page {page_num + 1}: {len(images)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_page_info("vini_francia_arezzo.pdf", 1) # Page 2
