import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Login — TrafficAI',
  description: 'Sign in to the AI Smart Traffic Management System',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
