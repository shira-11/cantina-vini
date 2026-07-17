import json

data = json.load(open('wines_data.json'))

for item in data:
    if "Data Inventario" in item["producer"]:
        item["producer"] = item["producer"].split("Data Inventario")[0].strip()
    
    # Filter grape varieties to remove table headers
    new_grapes = []
    for g in item["grapeVarieties"]:
        if "Annata" not in g["name"] and "Prezzo" not in g["name"]:
            new_grapes.append(g)
    item["grapeVarieties"] = new_grapes

json.dump(data, open('wines_data_clean.json', 'w'), indent=2)
