import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base "/PWD/" só no build de produção — é o path do GitHub Pages
// (homologação, github.com/mrgrafite/PWD — nome do repo é case-sensitive
// na URL do Pages). Na VM (produção) isso deixa de ser necessário;
// ajustar/remover quando migrar para lá.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/PWD/' : '/',
  server: {
    port: 5183,
    strictPort: true,
  },
}))
