import Link from "next/link";
import { TrendingUp, Youtube, Search, Compass, Star } from "lucide-react";

// Server-side data fetching
async function getMoviesData() {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) {
    console.error("TMDB Token is missing");
    return { trending: [], nowPlayingIds: new Set() };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // Fetch trending movies (for ranking)
    const trendingRes = await fetch("https://api.themoviedb.org/3/trending/movie/day?language=ko-KR", { 
      headers, 
      next: { revalidate: 3600 } 
    });
    
    // Fetch currently playing movies (to determine status badge)
    const playingRes = await fetch("https://api.themoviedb.org/3/movie/now_playing?language=ko-KR&region=KR", { 
      headers,
      next: { revalidate: 3600 }
    });

    const trendingData = await trendingRes.json();
    const playingData = await playingRes.json();

    const nowPlayingIds = new Set((playingData.results || []).map((m: any) => m.id));
    return { 
      trending: (trendingData.results || []).slice(0, 12), // Top 12 movies
      nowPlayingIds 
    };
  } catch (e) {
    console.error("Failed to fetch TMDB", e);
    return { trending: [], nowPlayingIds: new Set() };
  }
}

const TABS = [
  { id: "all", label: "Movie Lobby 종합 랭킹", icon: <TrendingUp size={16} /> },
  { id: "youtube", label: "YouTube 트렌드", icon: <Youtube size={16} /> },
  { id: "google", label: "Google 검색순위", icon: <Search size={16} /> },
  { id: "naver", label: "네이버 실시간", icon: <Compass size={16} /> },
];

export default async function Home() {
  const { trending, nowPlayingIds } = await getMoviesData();

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          지금 가장 핫한 <span style={{ color: 'var(--primary)' }}>영화</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          다양한 플랫폼의 데이터를 종합하여 현재 트렌드를 한눈에 확인하세요.
        </p>
        {!process.env.NEXT_PUBLIC_TMDB_TOKEN && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5' }}>
            ⚠️ Vercel 설정에서 NEXT_PUBLIC_TMDB_TOKEN 환경변수를 등록해야 실제 데이터가 보입니다.
          </div>
        )}
      </section>

      <section>
        <div className="tabs-container">
          {TABS.map((tab, idx) => (
            <Link 
              href="/" 
              key={tab.id}
              className={`tab-btn ${idx === 0 ? "active" : ""}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="movie-grid">
          {trending.map((movie: any, index: number) => {
            const isPlaying = nowPlayingIds.has(movie.id);
            const posterUrl = movie.poster_path 
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "https://via.placeholder.com/300x450/19191E/FFFFFF?text=No+Poster";

            return (
              <Link href={`/movie/${movie.id}`} key={movie.id}>
                <div className="movie-card glass">
                  <img src={posterUrl} alt={movie.title} className="poster" />
                  
                  <div className="rank-badge">{index + 1}</div>
                  
                  {isPlaying ? (
                    <div className="status-badge playing">상영중</div>
                  ) : (
                    <div className="status-badge ended">상영종료</div>
                  )}

                  <div className="info-overlay">
                    <div className="movie-title">{movie.title}</div>
                    <div className="movie-meta">
                      <Star size={14} fill="var(--accent-pink)" color="var(--accent-pink)" />
                      {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
