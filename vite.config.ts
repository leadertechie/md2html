import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'md2html',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['marked'],
    },
    minify: false,
    sourcemap: true,
  },
});
