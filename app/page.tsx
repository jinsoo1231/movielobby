import Link from "next/link";
import { TrendingUp, Youtube, Search, Compass, Star } from "lucide-react";
import YearSelector from "./YearSelector";

// Server-side data fetching
async function getMoviesData(page: number = 1, year: number) {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) {
    console.error("TMDB Token is missing");
    return { trending: [], nowPlayingIds: new Set(), totalPages: 1 };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // Fetch movies by year sorted by popularity
    const discoverRes = await fetch(
      `https://api.themoviedb.org/3/discover/movie?language=ko-KR&primary_release_year=${year}&sort_by=popularity.desc&page=${page}&vote_count.gte=100`, 
      { headers, next: { revalidate: 3600 } }
    );
    
    // Fetch currently playing movies (to determine status badge)
    const playingRes = await fetch("https://api.themoviedb.org/3/movie/now_playing?language=ko-KR&region=KR", { 
      headers,
      next: { revalidate: 3600 }
    });

    const discoverData = await discoverRes.json();
    const playingData = await playingRes.json();

    const nowPlayingIds = new Set((playingData.results || []).map((m: any) => m.id));
    return { 
      trending: discoverData.results || [],
      nowPlayingIds,
      totalPages: Math.min(discoverData.total_pages || 1, 500) // TMDB API max page is usually 500
    };
  } catch (e) {
    console.error("Failed to fetch TMDB", e);
    return { trending: [], nowPlayingIds: new Set(), totalPages: 1 };
  }
}

const TABS = [
  { id: "all", label: "Movie Lobby 종합 랭킹", icon: <TrendingUp size={16} /> },
  { id: "youtube", label: "YouTube 트렌드", icon: <Youtube size={16} /> },
  { id: "google", label: "Google 검색순위", icon: <Search size={16} /> },
  { id: "naver", label: "네이버 실시간", icon: <Compass size={16} /> },
];

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageParam = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  const currentPage = isNaN(pageParam) ? 1 : pageParam;
  
  const currentYear = new Date().getFullYear();
  const yearParam = typeof searchParams.year === 'string' ? Number(searchParams.year) : currentYear;
  const selectedYear = isNaN(yearParam) ? currentYear : yearParam;
  
  const { trending, nowPlayingIds, totalPages } = await getMoviesData(currentPage, selectedYear);

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          지금 가장 핫한 <span style={{ color: 'var(--primary)' }}>영화</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          연도별 인기 영화 랭킹을 한눈에 확인하세요.
        </p>
        
        {/* Year Selector UI */}
        <YearSelector currentYear={selectedYear} />

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

            // Calculate actual rank based on current page
            const rank = (currentPage - 1) * 20 + index + 1;

            return (
              <Link href={`/movie/${movie.id}`} key={movie.id}>
                <div className="movie-card glass">
                  <img src={posterUrl} alt={movie.title} className="poster" />
                  
                  <div className="rank-badge">{rank}</div>
                  
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

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '4rem', marginBottom: '2rem' }}>
            {currentPage > 1 && (
              <Link href={`/?year=${selectedYear}&page=${currentPage - 1}`} className="tab-btn" style={{ padding: '0.75rem 1rem' }}>
                이전
              </Link>
            )}
            
            {/* Show 5 page numbers around the current page */}
            {[...Array(5)].map((_, i) => {
              // Adjust start page so it doesn't go below 1 or exceed totalPages
              let startPage = Math.max(1, currentPage - 2);
              if (startPage + 4 > totalPages) {
                startPage = Math.max(1, totalPages - 4);
              }
              const pageNum = startPage + i;
              
              if (pageNum > totalPages) return null;
              
              return (
                <Link 
                  key={pageNum} 
                  href={`/?year=${selectedYear}&page=${pageNum}`} 
                  className={`tab-btn ${currentPage === pageNum ? "active" : ""}`}
                  style={{ padding: '0.75rem 1.2rem', minWidth: '45px', textAlign: 'center' }}
                >
                  {pageNum}
                </Link>
              );
            })}

            {currentPage < totalPages && (
              <Link href={`/?year=${selectedYear}&page=${currentPage + 1}`} className="tab-btn" style={{ padding: '0.75rem 1rem' }}>
                다음
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
