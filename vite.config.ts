import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the game from /game-jam-one-note/; the dev server stays at /.
  base: command === 'build' ? '/game-jam-one-note/' : '/',
}))
