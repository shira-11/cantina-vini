import fitz
import sys

def check_images(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        total_images = 0
        for i in range(min(50, len(doc))): # Check first 50 pages
            images = doc[i].get_images()
            total_images += len(images)
            if len(images) > 0:
                print(f"Page {i+1} has {len(images)} images.")
        
        print(f"Total images found in first 50 pages: {total_images}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_images("vini_francia_arezzo.pdf")
