import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const source = join(process.cwd(), 'public', '.htaccess');
const dest = join(process.cwd(), 'dist', '.htaccess');

try {
  if (existsSync(source)) {
    copyFileSync(source, dest);
    console.log('✅ .htaccess copiado para dist/');
  } else {
    console.warn('⚠️  Arquivo .htaccess não encontrado em public/');
  }
} catch (error) {
  console.error('❌ Erro ao copiar .htaccess:', error.message);
  process.exit(1);
}

