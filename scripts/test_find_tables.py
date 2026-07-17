import fitz

def test_find_tables(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    
    tabs = page.find_tables()
    print(f"Found {len(tabs.tables)} tables.")
    for i, tab in enumerate(tabs.tables):
        print(f"Table {i}:")
        df = tab.extract()
        for row in df:
            print(row)

if __name__ == "__main__":
    test_find_tables("vini_francia_arezzo.pdf", 100)
