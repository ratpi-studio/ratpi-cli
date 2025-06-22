import { defineConfig } from "tsup";
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "fs";
import { join } from "path";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

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
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node20", // ← c'est la clé ici pour Node 20+
  outDir: "dist",
  minify: true,
  onSuccess: () => {
    copyRecursive("static", "dist/static");
    const minimalPkg = {
      name: pkg.name,
      version: pkg.version,
      main: "index.js",
      dependencies: pkg.dependencies,
    };
    if (pkg.bin) {
      minimalPkg.bin = {};
      for (const cmd in pkg.bin) {
        minimalPkg.bin[cmd] = "./index.js";
      }
    }
    writeFileSync("dist/package.json", JSON.stringify(minimalPkg, null, 2));
  },
});
