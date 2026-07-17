const stockSummary = {};
const m = { location: { name: "Cantina Milano" }, bottleType: null, movementType: 'Ingresso', quantity: 2 };

const locName = m.location.name;
const typeStr = m.bottleType && m.bottleType !== "0,75 L" ? ` (${m.bottleType})` : "";
const key = `${locName}${typeStr}`;
stockSummary[key] = (stockSummary[key] || 0) + m.quantity;

console.log("stockSummary:", stockSummary);

const newMovement = { locationId: 1, bottleType: "Normale 0.75", movementType: 'Uscita', quantity: 1 };
const locName2 = "Cantina Milano";
const typeStr2 = newMovement.bottleType && newMovement.bottleType !== "0,75 L" ? ` (${newMovement.bottleType})` : "";
const key2 = `${locName2}${typeStr2}`;
const availableQty = stockSummary[key2] || 0;

console.log("key2:", key2, "availableQty:", availableQty);
