import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import neon from './neon-vite-plugin.ts'

const config = defineConfig({
  plugins: [
    neon,
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  define: {
    'process.env.DEV_USER_ID': JSON.stringify(process.env.DEV_USER_ID),
  },
})

export default config
