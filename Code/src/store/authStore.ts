import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, SignupData } from '@/lib/auth/AuthService';
import { UserRole } from '@/lib/auth/roles';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      role: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await AuthService.login(email, password);
          set({
            user: result.user,
            session: result.session,
            role: 'role' in result ? result.role : null,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          await AuthService.loginWithGoogle();
          // OAuth will redirect away — reset loading in case it doesn't
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signup: async (data) => {
        set({ loading: true, error: null });
        try {
          const result = await AuthService.signup(data);
          set({
            user: result.user,
            session: result.session,
            // role is not updated here because signup doesn't immediately log in with full profile in the same shape, 
            // but we can set it optimistically
            role: data.role,
            loading: false,
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true, error: null });
        try {
          await AuthService.logout();
          set({ user: null, session: null, role: null, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      restoreSession: async () => {
        set({ loading: true, error: null });
        try {
          // Strict 3-second timeout for session restoration (TASK 2)
          const { session, role } = await Promise.race([
            AuthService.getSession(),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("SESSION_TIMEOUT")), 3000))
          ]);
          if (session && role) {
            set({
              user: session.user,
              session,
              role,
            });
            console.log("authStore: SESSION_RESTORED");
          } else {
            // Invalid session: Clear authentication state
            set({ user: null, session: null, role: null });
            if (typeof window !== 'undefined') localStorage.removeItem('aetherflow-auth');
          }
        } catch (error: any) {
          console.error("Session restoration encountered an error, deleting session:", error);
          if (error?.message === "SESSION_TIMEOUT") {
            console.warn("authStore: SESSION_TIMEOUT");
          }
          set({ 
            user: null, 
            session: null, 
            role: null, 
            error: error.message || "Session recovery failed" 
          });
          if (typeof window !== 'undefined') localStorage.removeItem('aetherflow-auth');
        } finally {
          set({ loading: false });
          console.log("authStore: LOADING_RELEASED");
        }
      },
    }),
    {
      name: 'aetherflow-auth',
      partialize: (state) => ({ session: state.session, user: state.user, role: state.role }),
    }
  )
);
