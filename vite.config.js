import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from "path";
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const AUDIO_EXTS = /\.(mp3|wav|ogg|m4a|flac|aac)$/i;
const TITLE_NOISE = /\b(Full (Video|Song|Audio)|Official (Music )?Video|Audio Only|Lyrical|FULL AUDIO Song|Music Video|HD|Official Song)\b\s*[-|]?\s*/gi;
const NOISE_SEG = /^(Official (Music )?Video|Full (Video|Song|Audio)|Lyrical|Audio Only|HD|Official Song|RVCJ|T-Series|I Believe Music|Global Music Junction)$/i;

function parseFilename(filename, index) {
  const base = filename.replace(AUDIO_EXTS, '');
  const parts = base.split(/\s{2,}/);

  let title = (parts[0] || base).replace(TITLE_NOISE, '').replace(/\s*[-|]\s*$/, '').trim() || base;

  let artist = 'Instrumental';
  if (parts.length > 1) {
    const candidates = parts.slice(1).filter(p => p.trim() && !NOISE_SEG.test(p.trim()));
    artist = candidates[0]?.trim() || 'Unknown';
  }

  return { id: `auto_${index + 1}`, title, artist, src: `/audio/${filename}` };
}

function audioTracksPlugin() {
  const VIRTUAL = 'virtual:audio-tracks';
  const RESOLVED = `\0${VIRTUAL}`;
  const audioDir = resolve(__dirname, 'public/audio');

  function generate() {
    let files = [];
    try { files = readdirSync(audioDir).filter(f => AUDIO_EXTS.test(f)).sort(); } catch {}
    const tracks = files.map(parseFilename);
    return `export const MUSIC_TRACKS = ${JSON.stringify(tracks, null, 2)};\n`;
  }

  return {
    name: 'audio-tracks',
    resolveId(id) { if (id === VIRTUAL) return RESOLVED; },
    load(id) { if (id === RESOLVED) return generate(); },
    configureServer(server) {
      server.watcher.add(audioDir);
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);

      function invalidate(path) {
        if (!AUDIO_EXTS.test(path)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss(), audioTracksPlugin()],
  resolve: {
    alias: {
      '#components': resolve(dirname(fileURLToPath(import.meta.url)), 'src/components'),
      '#constants': resolve(dirname(fileURLToPath(import.meta.url)), 'src/constants'),
      '#lib': resolve(dirname(fileURLToPath(import.meta.url)), 'src/lib'),
      '#store': resolve(dirname(fileURLToPath(import.meta.url)), 'src/store'),
      '#hoc': resolve(dirname(fileURLToPath(import.meta.url)), 'src/hoc'),
      '#windows': resolve(dirname(fileURLToPath(import.meta.url)), 'src/windows'),
    }
  }
})
