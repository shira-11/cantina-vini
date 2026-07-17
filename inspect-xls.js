const xlsx = require('xlsx');

// Read the file
const workbook = xlsx.readFile('data base cantina.xls');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON and take the first few rows
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log(data.slice(0, 5));
