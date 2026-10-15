import { defineConfig } from 'vite';
// GitHub Pages serves this project below /deep-learning-assignment2/.
// Local production and development builds continue to use the site root.
const base = process.env.GITHUB_ACTIONS ? '/deep-learning-assignment2/' : '/';
export default defineConfig({base,server:{port:5173,strictPort:true,proxy:{'/api':'http://127.0.0.1:8000'}}});
