import Link from "next/link";
import SearchForm from "./SearchForm";

async function getTrendingMovies() {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) {
    return [
      { id: 1, title: "로컬 테스트 1", poster_path: null, release_date: "2026-08-14" },
      { id: 2, title: "로컬 테스트 2", poster_path: null, release_date: "2026-08-14" },
      { id: 3, title: "로컬 테스트 3", poster_path: null, release_date: "2026-08-14" },
      { id: 4, title: "로컬 테스트 4", poster_path: null, release_date: "2026-08-14" },
      { id: 5, title: "로컬 테스트 5", poster_path: null, release_date: "2026-08-14" }
    ];
  }

  try {
    const res = await fetch("https://api.themoviedb.org/3/trending/movie/week?language=ko-KR", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    return data.results ? data.results.slice(0, 10) : [];
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const trending = await getTrendingMovies();

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section className="hero-section">
        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 37, 65, 0.6)'
        }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title">Welcome.</h1>
          <h2 className="hero-subtitle">
            Millions of movies, TV shows and people to discover. Explore now.
          </h2>
          
          <SearchForm />
        </div>
      </section>

      {/* Trending Section */}
      <section className="container" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Trending</h2>
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--card-border)', 
            borderRadius: '20px',
            overflow: 'hidden',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <div style={{ padding: '4px 16px', background: 'var(--primary)', color: '#fff', borderRadius: '20px' }}>Today</div>
            <div style={{ padding: '4px 16px', color: 'var(--primary)' }}>This Week</div>
          </div>
        </div>

        {/* Horizontal Scroll List */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          overflowX: 'auto', 
          paddingBottom: '1.5rem',
          scrollbarWidth: 'thin'
        }}>
          {trending.map((movie: any) => (
            <Link key={movie.id} href={`/movie/${movie.id}`} style={{ minWidth: '150px', flex: '0 0 auto' }}>
              <div style={{ 
                width: '150px', 
                height: '225px', 
                borderRadius: '8px',
                backgroundImage: movie.poster_path ? `url(https://image.tmdb.org/t/p/w200${movie.poster_path})` : 'none',
                backgroundColor: '#ccc',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '0.8rem'
              }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {movie.title || movie.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {movie.release_date || movie.first_air_date || "Unknown"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
