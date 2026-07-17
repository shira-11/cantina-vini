export const getCountryFlag = (country) => {
  if (!country) return '';
  const c = country.toLowerCase().trim();
  if (c.includes('italia')) return '🇮🇹';
  if (c.includes('francia')) return '🇫🇷';
  if (c.includes('spagna')) return '🇪🇸';
  if (c.includes('germania')) return '🇩🇪';
  if (c.includes('stati uniti') || c.includes('usa')) return '🇺🇸';
  if (c.includes('sud africa')) return '🇿🇦';
  if (c.includes('nuova zelanda')) return '🇳🇿';
  if (c.includes('australia')) return '🇦🇺';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('cile')) return '🇨🇱';
  if (c.includes('portogallo')) return '🇵🇹';
  if (c.includes('austria')) return '🇦🇹';
  if (c.includes('svizzera')) return '🇨🇭';
  if (c.includes('grecia')) return '🇬🇷';
  if (c.includes('libano')) return '🇱🇧';
  if (c.includes('georgia')) return '🇬🇪';
  if (c.includes('slovenia')) return '🇸🇮';
  if (c.includes('croazia')) return '🇭🇷';
  if (c.includes('ungheria')) return '🇭🇺';
  if (c.includes('inghilterra') || c.includes('regno unito')) return '🇬🇧';
  if (c.includes('romania')) return '🇷🇴';
  return '🌍';
};

export const getBadgeClass = (category) => {
  if (!category) return 'badge';
  const cat = category.toLowerCase();
  if (cat.includes('ross')) return 'badge red';
  if (cat.includes('bianc')) return 'badge white';
  if (cat.includes('bollicin') || cat.includes('champagne')) return 'badge sparkling';
  return 'badge';
};

export const getStockBreakdown = (winesArray) => {
  if (!winesArray) return [];
  const locMap = {};
  winesArray.forEach(w => {
    if (!w.movements) return;
    w.movements.forEach(m => {
      const locName = m.location?.name || 'Senza Cantina';
      const isDefaultBottle = (bt) => !bt || bt === "0,75 L" || bt === "0.75 L" || bt === "Normale 0.75" || bt === "0,75L";
      const typeStr = !isDefaultBottle(m.bottleType) ? ` (${m.bottleType})` : "";
      const label = `${locName}${typeStr}`;
      if (!locMap[label]) locMap[label] = 0;
      if (m.movementType === 'Ingresso') locMap[label] += m.quantity;
      else if (m.movementType === 'Uscita') locMap[label] -= m.quantity;
    });
  });

  return Object.entries(locMap)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([loc, qty]) => ({ loc, qty }));
};
