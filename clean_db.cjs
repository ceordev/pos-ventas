const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://ebksyhrwrkefuqofangl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia3N5aHJ3cmtlZnVxb2ZhbmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDY5NjUsImV4cCI6MjA3MDU4Mjk2NX0.39_5zWwwZq05JuhqJx88ctH3gh-ONWYGKFypvR4aGUM'
);

async function check() {
  const { data: allProducts, error } = await sb.from('productos').select('id, nombre');
  if (error) { console.error('Error', error); return; }
  console.log('All products:', allProducts);
}
check();
