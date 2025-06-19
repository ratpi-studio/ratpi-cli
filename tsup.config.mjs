import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'
import pkg from './package.json' assert { type: 'json' }

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  if (statSync(src).isDirectory()) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const file of readdirSync(src)) {
      copyRecursive(join(src, file), join(dest, file));
    }
  } else {
    copyFileSync(src, dest);
  }
}

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  onSuccess: () => {
    // Copie du dossier static
    copyRecursive('static', 'dist/static');
    // Génération d'un package.json minimal
    const minimalPkg = {
      name: pkg.name,
      version: pkg.version,
      main: 'index.js',
      bin: pkg.bin ? 'index.js' : undefined,
      dependencies: pkg.dependencies
    };
    writeFileSync('dist/package.json', JSON.stringify(minimalPkg, null, 2));
  }
})