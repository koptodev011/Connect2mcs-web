import type { Metadata } from 'next';
import { Poppins, Space_Grotesk, Tiro_Devanagari_Marathi } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { GlobalToastProvider } from '@/components/primitives';
import { MobileMenuProvider } from '@/components/MobileMenuContext';
import { LocationProvider } from '@/components/LocationContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const tiroDevanagari = Tiro_Devanagari_Marathi({
  subsets: ['devanagari', 'latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-deva',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Connect2MCS — Marathi Community Platform',
  description: 'The home of the Marathi diaspora worldwide',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${spaceGrotesk.variable} ${tiroDevanagari.variable}`}>
      <body>
        <GlobalToastProvider>
          <MobileMenuProvider>
            <LocationProvider>
            <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
              <Sidebar />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
                <Header />
                <main style={{ flex: 1, padding: '28px 32px 64px', maxWidth: 1480, margin: '0 auto', width: '100%' }}>
                  {children}
                </main>
                <footer className="mob-pad-sm mob-hide" style={{
                  borderTop: '1px solid rgba(15,14,12,0.08)',
                  background: '#FFFFFF',
                  padding: '36px 32px',
                }}>
                  <div style={{ maxWidth: 1480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 100%' }}>
                      <div style={{ width: 32, height: 32, background: '#E26A1F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontFamily: 'var(--font-deva)', fontSize: 18, paddingTop: 2, flexShrink: 0 }}>म</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F0E0C', fontFamily: 'var(--font-display)' }}>Connect2MCS</div>
                        <div style={{ fontSize: 11.5, color: '#6B6256', fontWeight: 500, marginTop: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>The home of the Marathi diaspora · 38K+ members worldwide</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12.5, color: '#6B6256', fontWeight: 500, flexWrap: 'wrap' }}>
                      <span>About</span>
                      <span>Help</span>
                      <span>Privacy</span>
                      <span>Contact</span>
                      <span style={{ color: '#A39A8A' }}>· © 2026</span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
            </LocationProvider>
          </MobileMenuProvider>
        </GlobalToastProvider>
      </body>
    </html>
  );
}
