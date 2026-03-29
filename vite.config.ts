import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
    }),
  ],
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
