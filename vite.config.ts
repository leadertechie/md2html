import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'lit-renderer': resolve(__dirname, 'src/lit-renderer.ts'),
      },
      name: 'md2html',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'marked',
        'lit',
        'lit-html',
        'lit-html/directives/unsafe-html.js',
        'jsdom',
        'dompurify',
        '@leadertechie/telemetry',
      ],
    },
    minify: false,
    sourcemap: true,
  },
});
