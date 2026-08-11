import './globals.css';
import Header from '@/components/Header';
import { StoreProvider } from '@/components/StoreProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { DealsProvider } from '@/components/DealsProvider';
import localFont from 'next/font/local';

const esporte = localFont({ src: './fonts/esporte.ttf', variable: '--font-esporte' });

export const metadata = {
  title: 'Horaa Store — Premium PC Hardware in Nepal',
  description: 'Modern PC hardware and electronics store for Nepal.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={esporte.variable}>
        <AuthProvider>
          <StoreProvider>
            <WishlistProvider>
              <DealsProvider>
                <Header/>
                {children}
              </DealsProvider>
            </WishlistProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
