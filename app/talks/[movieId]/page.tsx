import Link from "next/link";
import { MessageSquare, Flame, ArrowLeft, Clock, ThumbsUp, Eye, Edit3, Film } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

import BoardSearch from "./BoardSearch";

export const revalidate = 0;

export default async function MovieTalkBoard({ 
  params,
  searchParams,
}: { 
  params: { movieId: string };
  searchParams: { title?: string; poster?: string; type?: string; q?: string };
}) {
  const movieId = parseInt(params.movieId);
  const movieTitle = searchParams.title || "영화";
  const moviePoster = searchParams.poster || "https://via.placeholder.com/150x225/19191E/FFFFFF?text=No+Poster";
  const searchType = searchParams.type || "title";
  const query = searchParams.q || "";

  // Fetch Best Posts (Top 3 by likes) - Only show when not searching
  let bestPosts: any[] = [];
  if (!query) {
    const { data } = await supabase
      .from('talk_posts')
      .select('id, title, author, views, likes, created_at')
      .eq('movie_id', movieId)
      .order('likes', { ascending: false })
      .limit(3);
    bestPosts = data || [];
  }

  // Fetch All Posts
  let allQuery = supabase
    .from('talk_posts')
    .select('id, title, author, views, likes, created_at')
    .eq('movie_id', movieId);

  if (query) {
    if (searchType === 'title') {
      allQuery = allQuery.ilike('title', `%${query}%`);
    } else if (searchType === 'content') {
      allQuery = allQuery.ilike('content', `%${query}%`);
    } else if (searchType === 'author') {
      allQuery = allQuery.ilike('author', `%${query}%`);
    } else if (searchType === 'title_content') {
      allQuery = allQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }
  }

  const { data: allPosts } = await allQuery.order('created_at', { ascending: false });

  // All posts should include everything, even best posts, so we don't filter them out.
  const regularPosts = allPosts || [];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
  };

  return (
    <div className="animate-fade-in container" style={{ paddingBottom: '4rem', paddingTop: '2rem', maxWidth: '1000px' }}>
      
      <Link href={`/movie/${movieId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> 영화 상세 페이지로 돌아가기
      </Link>

      {/* Board Header - Simplified like BBS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', borderBottom: '2px solid var(--foreground)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Film color="var(--primary)" size={32} />
          {movieTitle}
        </h1>
        <Link href={`/talks/${movieId}/write?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`} 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', padding: '0.6rem 1.2rem', borderRadius: '4px' }}>
          <Edit3 size={16} /> 글쓰기
        </Link>
      </div>

      {/* BBS Table */}
      <div style={{ width: '100%', fontSize: '0.95rem' }}>
        
        {/* Table Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '80px 1fr 120px 100px 80px 80px', 
          padding: '1rem 0', 
          borderBottom: '1px solid var(--card-border)', 
          fontWeight: 'bold', 
          color: 'var(--text-muted)', 
          textAlign: 'center' 
        }}>
          <div></div>
          <div style={{ textAlign: 'left', paddingLeft: '1rem' }}>제목</div>
          <div>작성자</div>
          <div>작성일</div>
          <div>조회수</div>
          <div>좋아요</div>
        </div>

        {/* BEST Posts Rows */}
        {bestPosts && bestPosts.length > 0 && bestPosts.some((p: any) => p.likes > 0) && (
          <div style={{ borderBottom: '1px solid var(--card-border)' }}>
            {bestPosts.filter((p: any) => p.likes > 0).map((post: any) => (
              <Link 
                href={`/talks/${movieId}/${post.id}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`} 
                key={`best-${post.id}`}
                className="hover-bg-light"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '80px 1fr 120px 100px 80px 80px', 
                  padding: '0.8rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  alignItems: 'center',
                  textDecoration: 'none', 
                  color: 'inherit',
                  background: 'rgba(236, 72, 153, 0.05)' // subtle pink tint
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>추천</span>
                </div>
                <div style={{ textAlign: 'left', paddingLeft: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.title}
                </div>
                <div style={{ textAlign: 'center', color: '#ccc' }}>{post.author}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(post.created_at)}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{post.views}</div>
                <div style={{ textAlign: 'center', color: 'var(--accent-pink)', fontSize: '0.9rem', fontWeight: 'bold' }}>{post.likes}</div>
              </Link>
            ))}
          </div>
        )}

        {/* All Posts Rows */}
        <div>
          {regularPosts && regularPosts.length > 0 ? (
            regularPosts.map((post: any, index: number) => (
              <Link 
                href={`/talks/${movieId}/${post.id}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`} 
                key={post.id}
                className="hover-bg-light"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '80px 1fr 120px 100px 80px 80px', 
                  padding: '0.8rem 0', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  alignItems: 'center',
                  textDecoration: 'none', 
                  color: 'inherit'
                }}
              >
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {regularPosts.length - index}
                </div>
                <div style={{ textAlign: 'left', paddingLeft: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.title}
                </div>
                <div style={{ textAlign: 'center', color: '#ccc' }}>{post.author}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatDate(post.created_at)}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{post.views}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{post.likes}</div>
              </Link>
            ))
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p>아직 등록된 토론 글이 없습니다. [글쓰기] 버튼을 눌러 첫 번째 글을 남겨주세요!</p>
            </div>
          )}
        </div>

      </div>

      {/* Search Bar at the bottom */}
      <BoardSearch movieId={movieId} movieTitle={movieTitle} moviePoster={moviePoster} />
    </div>
  );
}
