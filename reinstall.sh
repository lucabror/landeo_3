#!/bin/bash
# Script per ripristinare l'ambiente di lavoro

# Rimuovi tutte le dependency corrotte
rm -rf node_modules package-lock.json

# Installa le dependency base necessarie
npm install --no-save tsx@4.19.1
npm install --no-save vite@5.4.10
npm install --no-save express@4.21.2
npm install --no-save drizzle-orm@0.39.1

echo "Environment restored"