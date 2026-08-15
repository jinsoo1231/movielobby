"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TalkWritePage({ 
  params,
  searchParams
}: { 
  params: { movieId: string };
  searchParams: { title?: string; poster?: string };
}) {
  const router = useRouter();
  const movieId = parseInt(params.movieId);
  const movieTitle = searchParams.title || "영화";
  const moviePoster = searchParams.poster || "https://via.placeholder.com/150x225/19191E/FFFFFF?text=No+Poster";

  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !title.trim() || !content.trim()) {
      setError("닉네임, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { error: insertError } = await supabase
      .from('talk_posts')
      .insert([
        { 
          movie_id: movieId, 
          movie_title: movieTitle, 
          author: author.trim(), 
          title: title.trim(), 
          content: content.trim() 
        }
      ]);

    setIsSubmitting(false);

    if (insertError) {
      console.error(insertError);
      setError("글 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    } else {
      router.push(`/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`);
      router.refresh(); // Refresh the list
    }
  };

  return (
    <div className="animate-fade-in container" style={{ paddingBottom: '4rem', paddingTop: '2rem', maxWidth: '800px' }}>
      
      <Link href={`/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> 게시판으로 돌아가기
      </Link>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={moviePoster} alt={movieTitle} style={{ width: '60px', borderRadius: '4px' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>새로운 주제 등록</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{movieTitle}</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>작성자 닉네임</label>
            <input 
              type="text" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="게시판에서 사용할 닉네임을 입력하세요"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>글 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="토론할 주제나 글의 제목을 적어주세요"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>본문 내용</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 영화에 대한 감상이나 의견을 남겨주세요."
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                minHeight: '200px',
                resize: 'vertical',
                outline: 'none'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', border: 'none' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : <><Save size={20} /> 게시글 등록</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
