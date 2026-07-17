import fitz # PyMuPDF
import sys

def analyze_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        print(f"Total Pages: {len(doc)}")
        
        # Analyze first page
        page = doc[0]
        images = page.get_images()
        print(f"Images on Page 1: {len(images)}")
        
        if len(images) > 0:
            for img_index, img in enumerate(images):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_size = len(image_bytes)
                print(f" - Image {img_index}: size {image_size} bytes, ext {image_ext}")
                
                # Save the first image as a test
                if img_index == 0:
                    with open(f"test_page1_img.{image_ext}", "wb") as f:
                        f.write(image_bytes)
                    print(f"Saved test_page1_img.{image_ext}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_pdf("vini_francia_arezzo.pdf")
