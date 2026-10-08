import './globals.css';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'TCS MaturityIQ — AI Maturity Assessment Platform',
  description: 'Benchmark your organisation\'s AI maturity across SDLC and AMS with TCS MaturityIQ — the enterprise assessment platform for engineering and operations teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flexGrow: 1, padding: '24px 0 48px' }}>
              <div className="container" style={{ maxWidth: '1100px' }}>
                {children}
              </div>
            </main>
            <footer style={{
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              padding: '20px 0',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              textAlign: 'center',
            }}>
              <div className="container">
                <p style={{ margin: 0 }}>
                  © 2026 TCS MaturityIQ &nbsp;·&nbsp; AI Maturity Assessment Platform for SDLC &amp; AMS
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
