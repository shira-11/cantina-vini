import fitz

def find_first_card(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        for i in range(len(doc)):
            text = doc[i].get_text()
            if "Data Inventario :" in text:
                print(f"First card found on page {i + 1}")
                return
        print("No cards found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_first_card("vini_francia_arezzo.pdf")
