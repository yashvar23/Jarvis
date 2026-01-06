/**
 * Site Builder — Project Templates & Makefile Generation
 */

import type { ProjectTemplate } from './types.ts';

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'vite-react',
    name: 'React (Vite)',
    description: 'React 19 + TypeScript + Vite',
    command: 'bunx',
    args: ['create-vite', '--template', 'react-ts'],
    framework: 'vite-react',
  },
  {
    id: 'vite-vue',
    name: 'Vue (Vite)',
    description: 'Vue 3 + TypeScript + Vite',
    command: 'bunx',
    args: ['create-vite', '--template', 'vue-ts'],
    framework: 'vite-vue',
  },
  {
    id: 'vite-svelte',
    name: 'Svelte (Vite)',
    description: 'Svelte + TypeScript + Vite',
    command: 'bunx',
    args: ['create-vite', '--template', 'svelte-ts'],
    framework: 'vite-svelte',
  },
  {
    id: 'vite-vanilla',
    name: 'Vanilla (Vite)',
    description: 'Vanilla TypeScript + Vite',
    command: 'bunx',
    args: ['create-vite', '--template', 'vanilla-ts'],
    framework: 'vite-vanilla',
  },
  {
    id: 'next',
    name: 'Next.js',
    description: 'Next.js with App Router + TypeScript',
    command: 'bunx',
    args: ['create-next-app', '--ts', '--app', '--no-eslint', '--no-tailwind', '--no-src-dir', '--import-alias', '@/*'],
    framework: 'next',
  },
  {
    id: 'bun-react',
    name: 'Bun + React',
    description: 'Bun.serve() with React 19 + HTML imports',
    command: 'scaffold',
    args: [],
    framework: 'bun-react',
  },
];

/**
 * Generate a Makefile for the given framework.
 * All Makefiles must support `make dev` and respect the PORT env var.
 */
export function generateMakefile(framework: string): string {
  const header = `.PHONY: dev build clean install\n\nPORT ?= 3000\n\n`;

  switch (framework) {
    case 'vite-react':
    case 'vite-vue':
    case 'vite-svelte':
    case 'vite-vanilla':
      return header + `install:\n\tbun install\n\ndev:\n\tbunx vite --port $(PORT) --host 127.0.0.1\n\nbuild:\n\tbunx vite build\n\nclean:\n\trm -rf dist node_modules\n`;

    case 'next':
      return header + `install:\n\tbun install\n\ndev:\n\tbunx next dev -p $(PORT) -H 127.0.0.1\n\nbuild:\n\tbunx next build\n\nclean:\n\trm -rf .next node_modules\n`;

    case 'bun-react':
      return header + `install:\n\tbun install\n\ndev:\n\tBUN_PORT=$(PORT) bun --hot index.ts\n\nbuild:\n\tbun build index.html --outdir=dist\n\nclean:\n\trm -rf dist node_modules\n`;

    default:
      return header + `install:\n\tbun install\n\ndev:\n\techo "Configure your dev server to use port $(PORT)"\n\nbuild:\n\techo "Configure your build command"\n\nclean:\n\techo "Configure your clean command"\n`;
  }
}

/**
 * Scaffold the internal "bun-react" template (no CLI tool needed).
 */
export function scaffoldBunReact(projectPath: string): void {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`;

  const indexTs = `import index from "./index.html";

Bun.serve({
  port: parseInt(process.env.BUN_PORT || "3000"),
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(\`Server running on http://localhost:\${process.env.BUN_PORT || 3000}\`);
`;

  const appTsx = `import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Hello, World!</h1>
      <p>Start editing <code>src/App.tsx</code> to get started.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
`;

  const packageJson = JSON.stringify({
    name: "my-app",
    version: "0.1.0",
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "bun-types": "latest",
    },
  }, null, 2);

  const tsconfig = JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    include: ["src", "index.ts"],
  }, null, 2);

  const gitignore = `node_modules/
dist/
.DS_Store
`;

  Bun.write(`${projectPath}/index.html`, indexHtml);
  Bun.write(`${projectPath}/index.ts`, indexTs);
  Bun.write(`${projectPath}/src/App.tsx`, appTsx);
  Bun.write(`${projectPath}/package.json`, packageJson);
  Bun.write(`${projectPath}/tsconfig.json`, tsconfig);
  Bun.write(`${projectPath}/.gitignore`, gitignore);
}
