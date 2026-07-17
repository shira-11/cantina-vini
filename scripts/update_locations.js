const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mappings = [
  // Image 1
  { country: "Italia", region: "Toscana", producer: "Agricola San Felice" },
  { country: "Italia", region: "Toscana", producer: "Fattoria del Barbi" },
  { country: "Italia", region: "Toscana", producer: "Fattoria delle Ripalte" },
  { country: "Italia", region: "Toscana", producer: "Fattoria Di Muro" },
  { country: "Italia", region: "Toscana", producer: "Fattoria Di Petrolo" },
  { country: "Italia", region: "Toscana", producer: "Fattoria Di Poggiarello" },
  { country: "Italia", region: "Toscana", producer: "fattoria Di Varramista" },
  { country: "Italia", region: "Toscana", producer: "Fattoria Le Pupille" },
  { country: "Italia", region: "Toscana", producer: "Felsina" },
  { country: "Italia", region: "Toscana", producer: "il Marroneto" },
  { country: "Italia", region: "Toscana", producer: "Isole e Olena" },
  { country: "Italia", region: "Toscana", producer: "Heres" },
  { country: "Italia", region: "Toscana", producer: "La Lecciola" },
  { country: "Italia", region: "Toscana", producer: "La Massa" },
  { country: "Italia", region: "Toscana", producer: "La Querce" },
  { country: "Italia", region: "Toscana", producer: "Le Macchiole" },
  { country: "Italia", region: "Toscana", producer: "Le Sughere" },
  { country: "Italia", region: "Toscana", producer: "Leuta" },
  { country: "Italia", region: "Toscana", producer: "Tenimenti luigi D'Alessandro Manzano" },
  { country: "Italia", region: "Toscana", producer: "Marco Manetti" },
  { country: "Italia", region: "Toscana", producer: "Marco Vannucci" },
  { country: "Italia", region: "Toscana", producer: "Mattia Barzaghi" },
  { country: "Italia", region: "Toscana", producer: "Montauto" },
  { country: "Italia", region: "Toscana", producer: "Monte Bernardi" },
  { country: "Italia", region: "Toscana", producer: "Monteraponi" },
  { country: "Italia", region: "Toscana", producer: "Monteverro" },
  { country: "Italia", region: "Toscana", producer: "Montevertine" },
  { country: "Italia", region: "Toscana", producer: "Montis Pasquorum" },
  { country: "Italia", region: "Toscana", producer: "Palagetto" },
  { country: "Italia", region: "Toscana", producer: "Petrolo" },
  { country: "Italia", region: "Toscana", producer: "Pietramora Di Colle Fagiano" },
  { country: "Italia", region: "Toscana", producer: "Pieve Di Fontodi" },
  { country: "Italia", region: "Toscana", producer: "Gaja" },
  { country: "Italia", region: "Toscana", producer: "Collemassari" },
  { country: "Italia", region: "Toscana", producer: "Podere il Carnasciale" },

  // Image 2
  { country: "Italia", region: "Veneto", producer: "Zanoni" },
  { country: "Nuova Zelanda", region: "Marlborough", producer: "Cloudy Bay" },
  { country: "Nuova Zelanda", region: "Waiheke ISLAND", producer: "Goldwater" },
  { country: "Nuova Zelanda", region: "Waiheke ISLAND", producer: "Stonyridge" },
  { country: "Portogallo", region: "Douro", producer: "Quinta do Vale Meao" },
  { country: "Spagna", region: "Andalucia", producer: "Bodegas Hidalgo" },
  { country: "Spagna", region: "Castiglia e León", producer: "Bodegas Mauro" },
  { country: "Spagna", region: "Navarra", producer: "Hacienda de Arinzano" },
  { country: "Spagna", region: "Priorato", producer: "Casa Gran del Siurana" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Abadia de San Quirce" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Bodegas Vega Sicilia" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Dominio de Pingus" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Emilio Moro" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Pago de Los Capellanes" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Pago De Los Cappelanes" },
  { country: "Spagna", region: "Ribera del Duero", producer: "Vega Sicilia" },
  { country: "Spagna", region: "Rioja", producer: "Contino" },
  { country: "Spagna", region: "Rioja", producer: "Cune" },
  { country: "Spagna", region: "Rioja", producer: "La Nieta" },
  { country: "Spagna", region: "Rioja", producer: "Marques Riscal" },
  { country: "Spagna", region: "Rioja", producer: "Vinedos La Calle y Laorden" },
  { country: "USA", region: "California", producer: "Robert Mondavi" },

  // Image 3
  { country: "Italia", region: "Trentino Alto Adige", producer: "Azienda Agricola Dalzocchio" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Cantina Ghirlan" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Elena Walch" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Ferrari Fratelli Lunelli" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Foradori" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Franz Hass" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Giorgio Grai" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Gottardi" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Graziano Merotto" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Kettmeir" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Manni Nossing" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Peter Dipoli" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Carlo Guerrieri Gonzaga" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Terlan" },
  { country: "Italia", region: "Trentino Alto Adige", producer: "Tiefenbrunner" },
  { country: "Italia", region: "Umbria", producer: "Arnaldo Caprai" },
  { country: "Italia", region: "Veneto", producer: "Allegrini" },
  { country: "Italia", region: "Veneto", producer: "Azienda Agricola Vigneto Due Santi Zonta" },
  { country: "Italia", region: "Veneto", producer: "Belussi" },
  { country: "Italia", region: "Veneto", producer: "Casa Gialla" },
  { country: "Italia", region: "Veneto", producer: "Col De' Salici" },
  { country: "Italia", region: "Veneto", producer: "Dal Forno" },
  { country: "Italia", region: "Veneto", producer: "Diesel Farm Renzo Rosso" },
  { country: "Italia", region: "Veneto", producer: "Fratelli Speri" },
  { country: "Italia", region: "Veneto", producer: "La Collina dei Ciliegi" },
  { country: "Italia", region: "Veneto", producer: "Le Contrade" },
  { country: "Italia", region: "Veneto", producer: "Lenotti" },
  { country: "Italia", region: "Veneto", producer: "Perlage" },
  { country: "Italia", region: "Veneto", producer: "Quintarelli Giuseppe" },
  { country: "Italia", region: "Veneto", producer: "san Fermo" },
  { country: "Italia", region: "Veneto", producer: "Tenuta Borletti" },
  { country: "Italia", region: "Veneto", producer: "Tenuta Chiccheri" },
  { country: "Italia", region: "Veneto", producer: "Valdo" },
  { country: "Italia", region: "Veneto", producer: "Villa Sandi" },

  // Image 4
  { country: "Italia", region: "Toscana", producer: "Podere la Civettaja" },
  { country: "Italia", region: "Toscana", producer: "Podere Poggio Scalette" },
  { country: "Italia", region: "Toscana", producer: "Podere San Felice" },
  { country: "Italia", region: "Toscana", producer: "Poggio al Lupo" },
  { country: "Italia", region: "Toscana", producer: "Poggio L'Apparita" },
  { country: "Italia", region: "Toscana", producer: "Bernazzoni" },
  { country: "Italia", region: "Toscana", producer: "Azienda Agricola Barenghi Vilma Sandra Elisa" },
  { country: "Italia", region: "Toscana", producer: "Querciabella" },
  { country: "Italia", region: "Toscana", producer: "Riecine" },
  { country: "Italia", region: "Toscana", producer: "Rocca Di Castagnoli" },
  { country: "Italia", region: "Toscana", producer: "Rocca di Frassinello" },
  { country: "Italia", region: "Toscana", producer: "Salvioni" },
  { country: "Italia", region: "Toscana", producer: "San Fabiano" },
  { country: "Italia", region: "Toscana", producer: "San Giusto a Rentennano" },
  { country: "Italia", region: "Toscana", producer: "Sant'Appiano" },
  { country: "Italia", region: "Toscana", producer: "Serafico" },
  { country: "Italia", region: "Toscana", producer: "Siro Pacenti" },
  { country: "Italia", region: "Toscana", producer: "Soldera" },
  { country: "Italia", region: "Toscana", producer: "Tenimenti Luigi d'Alessandro Manzano" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Argentiera" },
  { country: "Italia", region: "Toscana", producer: "Antinori" },
  { country: "Italia", region: "Toscana", producer: "Frescobaldi" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Di Nozzole" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Guado al Tasso - Antinori" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Il Greppo" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Nuova" },
  { country: "Italia", region: "Toscana", producer: "Tenuta San Filippo" },
  { country: "Italia", region: "Toscana", producer: "Tenuta San Guido" },
  { country: "Italia", region: "Toscana", producer: "Tenuta Sette Ponti" },
  { country: "Italia", region: "Toscana", producer: "Tenute Silvio Nardi" },
  { country: "Italia", region: "Toscana", producer: "Testamatta" },
  { country: "Italia", region: "Toscana", producer: "Tua Rita" },
  { country: "Italia", region: "Toscana", producer: "Vadicava" },
  { country: "Italia", region: "Toscana", producer: "Vita Bella Tuscany Srl" }
];

async function main() {
  const wines = await prisma.wine.findMany();
  let updatedCount = 0;

  for (const wine of wines) {
    if (!wine.producer) continue;

    const wineProducer = wine.producer.trim().toLowerCase();
    
    // Trova una corrispondenza esatta ignorando maiuscole/minuscole
    const match = mappings.find(m => m.producer.toLowerCase() === wineProducer);

    if (match) {
      const needsUpdate = wine.country !== match.country || wine.region !== match.region;
      if (needsUpdate) {
        await prisma.wine.update({
          where: { id: wine.id },
          data: {
            country: match.country,
            region: match.region
          }
        });
        console.log(`Aggiornato [${wine.id}] ${wine.name} (${wine.producer}): Nazione->${match.country}, Regione->${match.region}`);
        updatedCount++;
      }
    }
  }

  console.log(`Completato! Vini aggiornati: ${updatedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
