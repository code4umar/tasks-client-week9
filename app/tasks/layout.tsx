import { AuthGuard } from '@/components/AuthGuard';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
