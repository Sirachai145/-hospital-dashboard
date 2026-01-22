import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// การตั้งค่านี้จะช่วยให้ Render รู้จักไลบรารี Excel (xlsx) โดยไม่ Error
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
})