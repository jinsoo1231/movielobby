import Link from "next/link";
import { Search, Image as ImageIcon, MessageSquare, ArrowLeft } from "lucide-react";
import TalksSearchForm from "../TalksSearchForm";

async function getTalksSearchResults(query: string) {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ko-KR&page=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

export default async function TalksSearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const results = q ? await getTalksSearchResults(q) : [];
  
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      <Link href="/talks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Talks 홈으로
      </Link>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Talks 영화 카테고리 검색</h1>
        <TalksSearchForm />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'var(--accent-pink)' }}>
        "{q}" 검색 결과
      </h2>
      
      {!q ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>검색어를 입력해주세요.</p>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>일치하는 영화 카테고리가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {results.map((item: any) => {
            const title = item.title || item.name;
            const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : "https://via.placeholder.com/300x450/19191E/FFFFFF?text=No+Poster";
            
            return (
              <Link 
                key={item.id} 
                href={`/talks/${item.id}?title=${encodeURIComponent(title)}&poster=${encodeURIComponent(posterUrl)}`}
                className="glass hover-lift"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: 'var(--card-border)', position: 'relative' }}>
                  {item.poster_path ? (
                    <img src={posterUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <ImageIcon size={32} color="var(--text-muted)" />
                    </div>
                  )}
                  {/* Category Badge overlay */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    <MessageSquare size={14} /> 입장
                  </div>
                </div>
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {item.release_date || "개봉일 미상"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
