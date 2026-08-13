import Link from "next/link";
import { Search, Image as ImageIcon } from "lucide-react";
import SearchForm from "../SearchForm";

async function getSearchResults(query: string) {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=ko-KR&page=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const results = q ? await getSearchResults(q) : [];
  
  // Filter out people, mostly want movies and tv
  const filtered = results.filter((r: any) => r.media_type !== 'person');

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <SearchForm />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
        "{q}" 검색 결과
      </h2>
      
      {!q ? (
        <p style={{ color: 'var(--text-muted)' }}>검색어를 입력해주세요.</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>일치하는 결과가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item: any) => (
            <Link key={item.id} href={`/movie/${item.id}`} style={{ 
              display: 'flex', 
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              background: 'var(--card-bg)'
            }}>
              <div style={{ 
                width: '100px', 
                height: '150px',
                flexShrink: 0,
                backgroundColor: 'var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt={item.title || item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={32} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {item.title || item.name}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  {item.release_date || item.first_air_date || "날짜 모름"}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.overview || "설명이 제공되지 않습니다."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
