import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = resolve(root, 'public/vendor');

const files = [
  {
    src: resolve(root, 'node_modules/three/build/three.min.js'),
    dest: resolve(vendorDir, 'three.min.js'),
  },
  {
    src: resolve(root, 'node_modules/three/build/three.module.js'),
    dest: resolve(vendorDir, 'three.module.js'),
  },
  {
    src: resolve(root, 'node_modules/three/examples/js/loaders/GLTFLoader.js'),
    dest: resolve(vendorDir, 'GLTFLoader.js'),
  },
  {
    src: resolve(root, 'node_modules/three/examples/jsm/loaders/GLTFLoader.js'),
    dest: resolve(vendorDir, 'GLTFLoader.module.js'),
  },
];

mkdirSync(vendorDir, { recursive: true });

let copied = 0;
for (const file of files) {
  if (!existsSync(file.src)) {
    console.warn(`[vendor] skipped (not found): ${file.src}`);
    continue;
  }

  copyFileSync(file.src, file.dest);
  copied += 1;
  console.log(`[vendor] copied: ${file.dest}`);
}

const gltfModulePath = resolve(vendorDir, 'GLTFLoader.module.js');
const threeModuleVendorPath = '/vendor/three.module.js';

if (existsSync(gltfModulePath)) {
  const source = readFileSync(gltfModulePath, 'utf8');
  const patched = source
    .replaceAll('from "three"', `from "${threeModuleVendorPath}"`)
    .replaceAll("from 'three'", `from '${threeModuleVendorPath}'`);

  if (patched !== source) {
    writeFileSync(gltfModulePath, patched, 'utf8');
    console.log(`[vendor] patched imports in: ${gltfModulePath}`);
  }
}

if (copied === 0) {
  console.warn('[vendor] no files copied. Run npm install first (with three dependency).');
}
