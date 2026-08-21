import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Film } from "lucide-react";
import SearchForm from "./SearchForm";
import HeaderAuth from "./HeaderAuth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Movie Lobby | 실시간 영화 트렌드 통합 플랫폼",
  description: "유튜브, 구글, 네이버 등 여러 플랫폼의 실시간 영화 순위와 반응을 한곳에 모아 보여줍니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <header className="header" style={{ backgroundColor: '#032541', color: '#fff' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <Link href="/" className="logo" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                <img src="/images/icon_logo.PNG" alt="MovieLobby" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                MovieLobby
              </Link>
              <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>
                <Link href="/movies" style={{ color: '#fff' }}>Movies</Link>
                <Link href="/talks" style={{ color: '#fff' }}>Talks</Link>
              </nav>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <SearchForm />
              <HeaderAuth />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer style={{ borderTop: '1px solid var(--card-border)', padding: '3rem 0', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p>&copy; 2026 Movie Lobby. All rights reserved.</p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>개인정보처리방침</Link>
            </div>
            <p style={{ marginTop: '1rem', opacity: 0.7 }}>Powered by Next.js & Vercel</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
