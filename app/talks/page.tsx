import Link from "next/link";
import { MessageSquare, Flame, Search, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import TalksSearchForm from "./TalksSearchForm";

async function getHotMovies() {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) {
    return [
      { id: 1, title: "로컬 테스트 1", poster_path: null },
      { id: 2, title: "로컬 테스트 2", poster_path: null },
      { id: 3, title: "로컬 테스트 3", poster_path: null },
      { id: 4, title: "로컬 테스트 4", poster_path: null },
      { id: 5, title: "로컬 테스트 5", poster_path: null }
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

export const revalidate = 0; // Disable cache to always show latest posts

export default async function TalksMainPage() {
  const hotMovies = await getHotMovies();
  
  // Fetch recent posts across all movies
  const { data: recentPosts } = await supabase
    .from('talk_posts')
    .select('id, movie_id, movie_title, title, author, views, likes, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* 1. Hero Search Section */}
      <section style={{ 
        padding: '5rem 1rem', 
        background: 'linear-gradient(to bottom, var(--primary) 0%, var(--background) 100%)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <MessageSquare size={48} color="#fff" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
            Movie Talks
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '3rem' }}>
            세상의 모든 영화에 대해 자유롭게 이야기하세요.
          </p>
          
          <TalksSearchForm />
        </div>
      </section>

      <div className="container" style={{ marginTop: '2rem' }}>
        {/* 2. Hot Movie Talks */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame color="var(--danger)" /> 지금 가장 뜨거운 영화
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }} className="hide-scrollbar">
            {hotMovies.map((movie: any) => (
              <Link 
                key={movie.id} 
                href={`/talks/${movie.id}?title=${encodeURIComponent(movie.title || movie.name)}&poster=${encodeURIComponent(movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster")}`}
                style={{ minWidth: '150px', flex: '0 0 auto', textDecoration: 'none' }}
              >
                <div style={{ width: '150px', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', background: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
                     className="hover-scale-img">
                  <img 
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster"} 
                    alt={movie.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <h3 style={{ marginTop: '0.8rem', fontSize: '1rem', color: '#fff', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {movie.title || movie.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Recent Discussions */}
        <section>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock color="var(--primary)" /> 실시간 최신 글
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentPosts && recentPosts.length > 0 ? (
              recentPosts.map((post: any) => (
                <Link 
                  href={`/talks/${post.movie_id}/${post.id}`} 
                  key={post.id}
                  className="glass hover-lift"
                  style={{ 
                    padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      background: 'var(--primary)', color: '#fff', fontSize: '0.8rem', 
                      padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' 
                    }}>
                      {post.movie_title || "영화"}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{post.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    <span>작성자: {post.author}</span>
                    <span>조회수 {post.views || 0}</span>
                    <span style={{ color: 'var(--accent-pink)' }}>추천 {post.likes || 0}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>아직 등록된 토론 글이 없습니다. 첫 번째 글의 주인공이 되어보세요!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
