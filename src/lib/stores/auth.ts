import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: number;
  nombres: string;
  usuario: string;
  direccion: string;
  telefono: string;
  id_rol: number;
  role: string;
  estado: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: true
};

export const authStore = writable<AuthState>(initialState);

class AuthService {
  constructor() {
    this.init();
  }

  private async init() {
    // Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      await this.loadUserProfile(session.user);
    } else {
      authStore.set({ user: null, profile: null, loading: false });
    }

    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.loadUserProfile(session.user);
      } else {
        authStore.set({ user: null, profile: null, loading: false });
      }
    });
  }

  private async loadUserProfile(user: User) {
    try {
      
      const { data: profile, error } = await supabase
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
        .eq('id_auth', user.id)
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }


      const userProfile: UserProfile = {
        ...profile,
        role: (profile as any).roles.nombre
      };

      authStore.set({
        user,
        profile: userProfile,
        loading: false
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      authStore.set({ user, profile: null, loading: false });
    }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async createCompany(companyData: {
    nombre: string;
    direccion_fiscal: string;
    simbolo_moneda: string;
  }) {
    const { data, error } = await supabase
      .rpc('crear_empresa', {
        _nombre: companyData.nombre,
        _direccion_fiscal: companyData.direccion_fiscal,
        _simbolo_moneda: companyData.simbolo_moneda
      });

    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();