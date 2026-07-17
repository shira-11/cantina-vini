import fitz
import json

def parse_page(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    words = page.get_text("words")
    
    # Group words by roughly the same Y coordinate (line)
    lines = {}
    for w in words:
        x0, y0, x1, y1, text, block_no, line_no, word_no = w
        # Round y0 to group texts on the same line (tolerance of ~5 pixels)
        y_group = round(y0 / 5) * 5
        if y_group not in lines:
            lines[y_group] = []
        lines[y_group].append((x0, text))
    
    # Sort lines by Y
    sorted_y = sorted(lines.keys())
    
    # For each line, sort words by X
    for y in sorted_y:
        line_words = sorted(lines[y], key=lambda item: item[0])
        line_text = " ".join([text for x0, text in line_words])
        print(f"Y={y}: {line_text}")

if __name__ == "__main__":
    parse_page("vini_francia_arezzo.pdf", 100)
