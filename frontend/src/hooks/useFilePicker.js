import { useCallback, useRef } from 'react';

/**
 * useFilePicker — Opens native OS file/directory pickers.
 *
 * Uses the File System Access API (Chrome 86+) with hidden-input fallback.
 *
 * Usage:
 *   const { pickFile, pickDirectory } = useFilePicker();
 *
 *   const file = await pickFile();
 *   // => { name: 'hello.js', content: '...', raw: File } | null
 *
 *   const files = await pickDirectory();
 *   // => [{ name, path, content, raw }, ...] | null
 */

// ── Hidden input helpers ──────────────────────────────────────

let inputCounter = 0;

function buildInput(attrs) {
  const id = `fp_${++inputCounter}`;
  document.getElementById(id)?.remove();
  const el = document.createElement('input');
  el.id = id;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style') for (const [sk, sv] of Object.entries(v)) el.style[sk] = sv;
    else el.setAttribute(k, v);
  }
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

function cleanInput(el) {
  if (el?.parentNode) el.remove();
}

/**
 * Pick a single file via hidden <input type="file">.
 * Resolves with { name, content, raw } or null if cancelled.
 * Safety timeout: 5 minutes (in case user leaves dialog open).
 */
function pickViaInput(accept) {
  return new Promise((resolve) => {
    const el = buildInput({ type: 'file', accept: accept || '' });
    let timer = setTimeout(() => { cleanInput(el); resolve(null); }, 5 * 60 * 1000);

    el.addEventListener('change', () => {
      clearTimeout(timer);
      const raw = el.files?.[0];
      if (!raw) { cleanInput(el); resolve(null); return; }
      raw.text()
        .then((content) => { cleanInput(el); resolve({ name: raw.name, content, raw }); })
        .catch(() => { cleanInput(el); resolve(null); });
    });

    el.click();
  });
}

/**
 * Pick a directory via hidden <input type="file" webkitdirectory>.
 * Returns file metadata + raw File objects (NO content reading).
 * The caller reads content for each file individually.
 */
function pickDirViaInput() {
  return new Promise((resolve) => {
    const el = buildInput({ type: 'file', webkitdirectory: '' });
    let timer = setTimeout(() => { cleanInput(el); resolve(null); }, 60 * 1000);

    el.addEventListener('change', () => {
      clearTimeout(timer);
      const list = el.files;
      if (!list?.length) { cleanInput(el); resolve(null); return; }

      const results = [];
      for (const raw of list) {
        results.push({
          name: raw.name,
          path: raw.webkitRelativePath || raw.name,
          raw,
        });
      }
      cleanInput(el);
      resolve(results);
    });

    el.click();
  });
}

// ── Hook ──────────────────────────────────────────────────────

export function useFilePicker() {
  const fallbackRef = useRef(false);

  const pickFile = useCallback(async (accept) => {
    console.log('[FilePicker] pickFile called');
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: accept ? [{ description: 'Files', accept: { 'text/*': [accept] } }] : undefined,
        });
        const raw = await handle.getFile();
        const content = await raw.text();
        console.log('[FilePicker] ✅ picked via File System API:', raw.name);
        return { name: raw.name, content, raw };
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('[FilePicker] user cancelled');
          return null;
        }
        console.warn('[FilePicker] API failed, using fallback:', err.name);
      }
    }
    fallbackRef.current = true;
    console.log('[FilePicker] using hidden input');
    return pickViaInput(accept);
  }, []);

  const pickDirectory = useCallback(async () => {
    console.log('[FilePicker] pickDirectory called — using native input picker');
    fallbackRef.current = true;
    const result = await pickDirViaInput();
    console.log('[FilePicker] dir input returned:', result ? result.length + ' files' : 'null');
    return result;
  }, []);

  return { pickFile, pickDirectory, usedFallback: fallbackRef };
}
