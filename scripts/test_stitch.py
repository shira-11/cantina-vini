import fitz
from PIL import Image
import io

def test_stitch(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    images_info = page.get_images()
    print(f"Found {len(images_info)} images.")
    
    pil_images = []
    
    for img in images_info:
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        
        # Load with PIL
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_images.append(pil_img)
        
    # Assume all have same width
    width = pil_images[0].width
    total_height = sum(img.height for img in pil_images)
    
    # Try top-to-bottom order (which is usually the list order or reversed)
    # Let's just use the order in the list, but maybe it's bottom-up?
    # PyMuPDF usually extracts them in drawing order, which for sliced images might be top-to-bottom or bottom-to-top.
    # Let's save both!
    
    stitched_normal = Image.new('RGB', (width, total_height))
    y_offset = 0
    for img in pil_images:
        stitched_normal.paste(img, (0, y_offset))
        y_offset += img.height
    stitched_normal.save('test_stitch_normal.jpg')
    
    stitched_reversed = Image.new('RGB', (width, total_height))
    y_offset = 0
    for img in reversed(pil_images):
        stitched_reversed.paste(img, (0, y_offset))
        y_offset += img.height
    stitched_reversed.save('test_stitch_reversed.jpg')

if __name__ == "__main__":
    test_stitch("vini_francia_arezzo.pdf", 53)
