import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    
    
    // 1. Intentar autenticación
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return json({ error: 'Authentication failed', details: authError }, { status: 401 });
    }
    
    
    // 2. Intentar consulta directa a usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_auth', authData.user.id)
      .single();
    
    if (userError) {
      console.error('User query error:', userError);
      return json({ 
        error: 'User query failed', 
        details: userError,
        user_id: authData.user.id 
      }, { status: 500 });
    }
    
    
    // 3. Intentar consulta con join a roles
    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombres,
        usuario,
        direccion,
        telefono,
        id_rol,
        estado,
        roles!inner(nombre)
      `)
      .eq('id_auth', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile query error:', profileError);
      return json({ 
        error: 'Profile query failed', 
        details: profileError,
        user_data: userData 
      }, { status: 500 });
    }
    
    
    return json({ 
      success: true, 
      auth_data: authData.user,
      user_data: userData,
      profile_data: profileData
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ error: 'Unexpected error', details: error }, { status: 500 });
  }
};