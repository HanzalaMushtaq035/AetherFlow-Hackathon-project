export type UserRole = 'resident' | 'technician' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  avatar: string | null;
  created_at: string;
}

export const RoleGuards = {
  isResident: (role?: string): boolean => role === 'resident',
  isTechnician: (role?: string): boolean => role === 'technician',
  isAdmin: (role?: string): boolean => role === 'admin',
};

export const RoleHelper = {
  getRedirectPath: (role: UserRole): string => {
    switch (role) {
      case 'resident': return '/home';
      case 'technician': return '/technician/home';
      case 'admin': return '/admin/home';
      default: return '/home';
    }
  }
};
