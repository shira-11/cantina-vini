import { prisma } from './prisma.js';

/**
 * Normalizes values and adds them to SystemSettings under custom_metadata_${field}.
 * Also removes them from hidden_metadata_${field} if present.
 */
export async function addCustomMetadata(field, valueOrValues) {
  if (!field || !valueOrValues) return;
  const values = (Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues])
    .map(v => (v !== null && v !== undefined) ? String(v).trim() : '')
    .filter(v => v.length > 0);

  if (values.length === 0) return;

  const key = `custom_metadata_${field}`;
  const hiddenKey = `hidden_metadata_${field}`;

  try {
    // 1. Unhide any if previously hidden
    const hiddenSetting = await prisma.systemSettings.findUnique({ where: { key: hiddenKey } });
    if (hiddenSetting && hiddenSetting.value) {
      try {
        let hiddenList = JSON.parse(hiddenSetting.value);
        let changed = false;
        values.forEach(v => {
          if (hiddenList.includes(v)) {
            hiddenList = hiddenList.filter(item => item !== v);
            changed = true;
          }
        });
        if (changed) {
          await prisma.systemSettings.upsert({
            where: { key: hiddenKey },
            update: { value: JSON.stringify(hiddenList) },
            create: { key: hiddenKey, value: JSON.stringify(hiddenList) }
          });
        }
      } catch (e) {}
    }

    // 2. Add to custom_metadata_${field}
    const existing = await prisma.systemSettings.findUnique({ where: { key } });
    let list = [];
    if (existing && existing.value) {
      try { list = JSON.parse(existing.value); } catch(e) {}
    }
    let updated = false;
    values.forEach(val => {
      if (!list.includes(val)) {
        list.push(val);
        updated = true;
      }
    });

    if (updated) {
      await prisma.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { key, value: JSON.stringify(list) }
      });
    }
  } catch (err) {
    console.error(`Error saving custom metadata for ${field}:`, err);
  }
}

/**
 * Renames a custom value in custom_metadata_${field}
 */
export async function renameCustomMetadata(field, oldVal, newVal) {
  if (!field || !oldVal || !newVal) return;
  const key = `custom_metadata_${field}`;
  const oldTrimmed = String(oldVal).trim();
  const newTrimmed = String(newVal).trim();
  if (!oldTrimmed || !newTrimmed || oldTrimmed === newTrimmed) return;

  try {
    const existing = await prisma.systemSettings.findUnique({ where: { key } });
    let list = [];
    if (existing && existing.value) {
      try { list = JSON.parse(existing.value); } catch(e) {}
    }
    let updated = false;
    if (list.includes(oldTrimmed)) {
      list = list.map(item => item === oldTrimmed ? newTrimmed : item);
      updated = true;
    } else if (!list.includes(newTrimmed)) {
      list.push(newTrimmed);
      updated = true;
    }

    if (updated) {
      await prisma.systemSettings.upsert({
        where: { key },
        update: { value: JSON.stringify(list) },
        create: { key, value: JSON.stringify(list) }
      });
    }
  } catch (err) {
    console.error(`Error renaming custom metadata for ${field}:`, err);
  }
}

/**
 * Removes a custom value from custom_metadata_${field}
 */
export async function removeCustomMetadata(field, val) {
  if (!field || !val) return;
  const key = `custom_metadata_${field}`;
  const trimmed = String(val).trim();
  if (!trimmed) return;

  try {
    const existing = await prisma.systemSettings.findUnique({ where: { key } });
    if (existing && existing.value) {
      let list = JSON.parse(existing.value);
      if (list.includes(trimmed)) {
        list = list.filter(item => item !== trimmed);
        await prisma.systemSettings.upsert({
          where: { key },
          update: { value: JSON.stringify(list) },
          create: { key, value: JSON.stringify(list) }
        });
      }
    }
  } catch (err) {
    console.error(`Error removing custom metadata for ${field}:`, err);
  }
}
