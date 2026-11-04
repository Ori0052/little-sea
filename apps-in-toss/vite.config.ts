import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
import config from './apps-in-toss.config';
export default defineConfig({
  root:fileURLToPath(new URL('.',import.meta.url)),
  publicDir:'../public',
  plugins:[react(),{name:'bundle-system-fonts',enforce:'pre',transform(code,id){if(id.split('?')[0].endsWith('/app/globals.css'))return code.replace(/^@import url\('https:\/\/fonts\.googleapis\.com[^\n]+\n/,'')}}],
  resolve:{dedupe:['react','react-dom']},
  define:{__SEA_TOSS_APP_NAME__:JSON.stringify(config.appName),__SEA_API_ORIGIN__:JSON.stringify('https://little-sea.rhfenrdltkfk.chatgpt.site')},
  server:{fs:{allow:['..']},proxy:{'/api':{target:'http://127.0.0.1:5173',changeOrigin:true}}},
  build:{outDir:'dist',emptyOutDir:true,sourcemap:false,target:'es2020'}
});
