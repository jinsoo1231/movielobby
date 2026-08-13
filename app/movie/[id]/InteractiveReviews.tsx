"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Star } from "lucide-react";

export default function InteractiveReviews({ initialReviews, movieId }: { initialReviews: any[], movieId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  // Load reviews from local storage on mount and combine with initial reviews
  useEffect(() => {
    const saved = localStorage.getItem(`reviews_${movieId}`);
    if (saved) {
      setReviews([...JSON.parse(saved), ...initialReviews]);
    } else {
      setReviews(initialReviews);
    }
  }, [initialReviews, movieId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("별점을 선택해주세요.");
    if (!text.trim()) return alert("감상평을 입력해주세요.");

    const newReview = {
      id: Date.now(),
      author: "익명 유저",
      text,
      rating,
      platform: "MovieLobby",
      isLocal: true
    };

    const saved = localStorage.getItem(`reviews_${movieId}`);
    const localReviews = saved ? JSON.parse(saved) : [];
    const updatedLocal = [newReview, ...localReviews];
    
    localStorage.setItem(`reviews_${movieId}`, JSON.stringify(updatedLocal));
    
    setReviews([newReview, ...reviews]);
    setText("");
    setRating(0);
    setHoverRating(0);
  };

  return (
    <div>
      <h2 className="section-title"><MessageSquare size={24} color="var(--primary)" /> 실시간 리뷰</h2>
      
      {/* Review Form */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--foreground)' }}>내 감상평 남기기</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Star Rating (1-10) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {[...Array(10)].map((_, i) => {
              const starValue = i + 1;
              return (
                <Star
                  key={starValue}
                  size={28}
                  fill={(hoverRating || rating) >= starValue ? "var(--accent-pink)" : "transparent"}
                  color={(hoverRating || rating) >= starValue ? "var(--accent-pink)" : "var(--text-muted)"}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starValue)}
                />
              );
            })}
            <span style={{ marginLeft: '1rem', color: 'var(--accent-pink)', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {rating > 0 ? `${rating} / 10` : "별점을 선택해주세요"}
            </span>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="이 영화에 대한 감상평을 작성해주세요."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--foreground)',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none'
            }}
          />
          <button 
            type="submit"
            style={{
              alignSelf: 'flex-end',
              background: 'var(--primary)',
              color: 'var(--foreground)',
              border: 'none',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            등록
          </button>
        </form>
      </div>

      {/* Review List */}
      {reviews && reviews.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {reviews.map((review: any) => (
            <div key={review.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: review.isLocal ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {review.author}
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: review.isLocal ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'normal' }}>
                    {review.platform}
                  </span>
                </strong>
                {review.rating && <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>★ {review.rating}</span>}
              </div>
              <p style={{ color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{review.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>아직 등록된 리뷰가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
