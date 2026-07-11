export interface DashboardUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';
}
