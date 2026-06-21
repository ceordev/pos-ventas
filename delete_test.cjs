const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve('.env');

if (fs.existsSync(dotenvPath)) {
  const env = fs.readFileSync(dotenvPath, 'utf8').split('\n').reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    if (k) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
    return acc;
  }, {});
  
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  
  async function run() {
    // Buscar
    const { data, error } = await sb.from('productos').select('id, nombre').ilike('nombre', '%Test%');
    console.log('Productos encontrados:', data, error);
    
    if (data && data.length > 0) {
      for (const p of data) {
        if (p.nombre.toLowerCase().includes('test')) {
          console.log(`Borrando producto ID: ${p.id} - ${p.nombre}`);
          const { error: delErr } = await sb.from('productos').delete().eq('id', p.id);
          console.log('Resultado del borrado:', delErr || 'Exito');
        }
      }
    }
  }
  
  run();
} else {
  console.log('No .env file found');
}
