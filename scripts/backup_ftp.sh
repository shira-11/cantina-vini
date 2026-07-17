#!/bin/bash
# Crea la cartella per l'FTP e un file ZIP di backup

echo "Creazione cartella FTP..."
rm -rf "sito vino da carica FTP"
mkdir "sito vino da carica FTP"

cp -R app "sito vino da carica FTP/"
cp -R public "sito vino da carica FTP/"
cp -R prisma "sito vino da carica FTP/"
cp -R scripts "sito vino da carica FTP/" 2>/dev/null || true
cp -R lib "sito vino da carica FTP/" 2>/dev/null || true
cp package.json "sito vino da carica FTP/"
cp package-lock.json "sito vino da carica FTP/" 2>/dev/null || true
cp next.config.mjs "sito vino da carica FTP/" 2>/dev/null || true
cp proxy.js "sito vino da carica FTP/" 2>/dev/null || true
cp middleware.js "sito vino da carica FTP/" 2>/dev/null || true
cp .env "sito vino da carica FTP/" 2>/dev/null || true

echo "Cartella FTP creata: 'sito vino da carica FTP'"

ZIP_NAME="backup_vini_$(date +%Y-%m-%d_%H-%M).zip"
echo "Creazione backup ZIP: $ZIP_NAME ..."
zip -r -q "$ZIP_NAME" . -x "node_modules/*" -x ".next/*" -x ".git/*" -x "sito vino da carica FTP/*" -x "*.zip"

echo "Backup completato con successo!"
