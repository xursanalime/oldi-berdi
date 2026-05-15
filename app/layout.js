import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Oldi-Berdi — Qarz boshqaruv tizimi',
  description: 'Odamlar orasidagi qarz berish va olishni raqamlashtiruvchi hamda huquqiy kuchga ega qiladigan platforma',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
