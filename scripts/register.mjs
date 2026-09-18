import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Node 24 remove tipos nativamente; este hook resolve os aliases do projeto.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('/node_modules/')) return nextResolve(specifier, context);
    let candidate;
    if (specifier.startsWith('@/')) candidate = path.resolve('src', specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) candidate = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    if (candidate) {
      for (const suffix of ['', '.ts', '.tsx', '.js', '/index.ts']) {
        if (existsSync(candidate + suffix)) return nextResolve(pathToFileURL(candidate + suffix).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
