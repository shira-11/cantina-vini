const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Leggo i dati dal database...");
  
  const wines = await prisma.wine.findMany({
    orderBy: [
      { country: 'asc' },
      { region: 'asc' },
      { producer: 'asc' },
      { id: 'asc' }
    ]
  });

  console.log(`Trovati ${wines.length} vini. Generazione del file Excel in corso...`);

  // Prepare data for Excel
  const excelData = wines.map(wine => ({
    "ID": wine.id,
    "Vino": wine.name || "",
    "Annata": wine.vintage || "",
    "Nazione": wine.country || "",
    "Regione": wine.region || "",
    "Cantina (Producer Cellar)": wine.producerCellar || "",
    "Produttore": wine.producer || "",
    "Classificazione": wine.classification || "",
    "Categoria": wine.category || "",
    "Tipologia": wine.type || "",
    "Note": wine.notes || "",
    "Archiviato": wine.isArchived ? "Sì" : "No"
  }));

  // Create a new workbook and add the worksheet
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const wscols = [
    { wch: 10 }, // ID Wine
    { wch: 15 }, // Categoria
    { wch: 15 }, // Sottocategoria
    { wch: 15 }, // Nazione
    { wch: 20 }, // Regione
    { wch: 30 }, // Produttore
    { wch: 40 }, // Vino
    { wch: 10 }, // Annata
    { wch: 15 }, // Formato
    { wch: 10 }, // Quantità
    { wch: 30 }  // Note
  ];
  worksheet['!cols'] = wscols;

  xlsx.utils.book_append_sheet(workbook, worksheet, "Lista Vini");

  // Define the output path in the Downloads folder
  const outputPath = path.join(process.env.HOME || process.env.USERPROFILE || '/Users/casamilano', 'Downloads', 'Lista_Vini_Completa.xlsx');
  
  // Write the file
  xlsx.writeFile(workbook, outputPath);

  console.log(`\n🎉 Fatto! Il file Excel è stato salvato con successo in:`);
  console.log(`👉 ${outputPath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
