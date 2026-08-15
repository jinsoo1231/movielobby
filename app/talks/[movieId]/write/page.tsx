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
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!author.trim() || !title.trim() || !content.trim()) {
      alert("닉네임, 제목, 내용을 모두 입력해주세요.");
      setError("닉네임, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from('talk_posts')
        .insert([
          { 
            movie_id: movieId, 
            movie_title: movieTitle, 
            author: author.trim(), 
            title: title.trim(), 
            content: content.trim(),
            is_spoiler: isSpoiler
          }
        ]);

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        alert(`에러: ${insertError.message}`);
        setError(`글 등록 중 오류가 발생했습니다: ${insertError.message || JSON.stringify(insertError)}`);
        setIsSubmitting(false);
      } else {
        alert("게시글이 성공적으로 등록되었습니다! 게시판으로 이동합니다.");
        window.location.href = `/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`;
      }
    } catch (err: any) {
      console.error("Unexpected Error:", err);
      alert(`시스템 에러: ${err.message}`);
      setError(`예기치 못한 시스템 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
      setIsSubmitting(false);
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>작성자 닉네임</label>
              <span style={{ fontSize: '0.8rem', color: author.length >= 15 ? 'var(--danger)' : 'var(--text-muted)' }}>{author.length} / 15자</span>
            </div>
            <input 
              type="text" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="게시판에서 사용할 닉네임을 입력하세요"
              maxLength={15}
              style={{
                background: '#f9fafb',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '1rem',
                outline: 'none',
                width: '100%'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>글 제목</label>
              <span style={{ fontSize: '0.8rem', color: title.length >= 50 ? 'var(--danger)' : 'var(--text-muted)' }}>{title.length} / 50자</span>
            </div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="토론할 주제나 글의 제목을 적어주세요"
              maxLength={50}
              style={{
                background: '#f9fafb',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '1rem',
                outline: 'none',
                width: '100%'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>본문 내용</label>
              <span style={{ fontSize: '0.8rem', color: content.length >= 2000 ? 'var(--danger)' : 'var(--text-muted)' }}>{content.length} / 2000자</span>
            </div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 영화에 대한 감상이나 의견을 남겨주세요."
              maxLength={2000}
              style={{
                background: '#f9fafb',
                border: '1px solid var(--card-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '1rem',
                minHeight: '200px',
                resize: 'vertical',
                outline: 'none',
                width: '100%'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <input 
              type="checkbox" 
              id="spoiler" 
              checked={isSpoiler} 
              onChange={(e) => setIsSpoiler(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-pink)' }}
              disabled={isSubmitting}
            />
            <label htmlFor="spoiler" style={{ color: 'var(--accent-pink)', fontWeight: 'bold', cursor: 'pointer' }}>
              🚨 스포일러가 포함된 글입니다 (체크 시 글 목록과 본문에서 내용이 보호됩니다)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={handleSubmit}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', border: 'none' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : <><Save size={20} /> 게시글 등록</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
