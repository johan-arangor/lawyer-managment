const bcrypt = require('bcrypt');

const password = 'adminL4wyer*';
const hash = '$2b$10$vVsuByWAXgwme8rMK3irlOf93zh82GbqA5fLSbSTQ92XA7bXt2iTa';

async function test() {
  console.log('--- TEST DE BCRYPT ---');
  console.log('Password a probar:', password);
  console.log('Hash en BD:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('¿Es válido?:', isValid ? '✅ SÍ' : '❌ NO');
}

test();
