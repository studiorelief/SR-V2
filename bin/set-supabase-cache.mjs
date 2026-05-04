#!/usr/bin/env node
/**
 * ============================================================================
 *  SET SUPABASE CACHE
 * ============================================================================
 *
 *  Met à jour le `Cache-Control` de tous les fichiers du dossier ciblé dans
 *  un bucket Supabase Storage. Par défaut, vise le dossier `video/` du bucket
 *  `SR_assets` (les vidéos hero/preloader/mascotte).
 *
 *  Pourquoi : Supabase pose un Cache-Control par défaut de 3600s (1h) sur
 *  les uploads. Pour des assets quasi-statiques (vidéos hero), on veut un
 *  cache long (1 an + immutable) → meilleur score Lighthouse + Field Data
 *  CrUX, et économie de bande passante côté users.
 *
 *  Supabase ne permet pas d'éditer le Cache-Control via le dashboard ; la
 *  seule façon est de télécharger + ré-uploader les fichiers via l'API
 *  avec `cacheControl` dans les options.
 *
 *  Usage :
 *    SUPABASE_SERVICE_ROLE_KEY=eyJ... node bin/set-supabase-cache.mjs
 *
 *  ⚠️  La service_role key donne accès admin total à la DB. Ne PAS la commit.
 *      → Project Settings → API → "service_role" secret
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nsbivjygtwdtnijkvewq.supabase.co';
const BUCKET = 'SR_assets';
const FOLDER = 'video';
const CACHE_SECONDS = 31_536_000; // 1 an

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY env var manquante.');
  console.error('   Récupère-la dans Supabase → Project Settings → API → service_role.');
  console.error('   Puis relance : SUPABASE_SERVICE_ROLE_KEY=eyJ... node bin/set-supabase-cache.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log(`🪣 Bucket: ${BUCKET} / dossier: ${FOLDER}/`);
console.log(`⏱️  Cache cible: ${CACHE_SECONDS}s (${(CACHE_SECONDS / 86_400).toFixed(0)} jours)\n`);

const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list(FOLDER, {
  limit: 1000,
});
if (listErr) {
  console.error(`❌ Liste impossible: ${listErr.message}`);
  process.exit(1);
}

const realFiles = files.filter((f) => !f.name.startsWith('.') && f.metadata?.size > 0);
console.log(`📁 ${realFiles.length} fichier(s) à mettre à jour\n`);

let success = 0;
let failures = 0;

for (const file of realFiles) {
  const path = `${FOLDER}/${file.name}`;
  const sizeKB = (file.metadata.size / 1024).toFixed(1);

  try {
    process.stdout.write(`⬇️  ${path} (${sizeKB} KB) ... `);
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
    if (dlErr) throw new Error(`download: ${dlErr.message}`);

    process.stdout.write('⬆️  ');
    const { error: upErr } = await supabase.storage.from(BUCKET).update(path, blob, {
      cacheControl: String(CACHE_SECONDS),
      upsert: true,
      contentType: file.metadata.mimetype || blob.type,
    });
    if (upErr) throw new Error(`upload: ${upErr.message}`);

    console.log('✅');
    success++;
  } catch (err) {
    console.log(`❌ ${err.message}`);
    failures++;
  }
}

console.log(`\n🎉 ${success} succès, ${failures} échec(s)`);
if (failures > 0) process.exit(1);
