"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Star, StarHalf, ThumbsUp, ThumbsDown, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function InteractiveReviews({ initialReviews, movieId }: { initialReviews: any[], movieId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [nickname, setNickname] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});
  
  // Next.js App Router 쿠키 기반 Supabase 브라우저 클라이언트 생성
  const supabase = createClient();

  useEffect(() => {
    // 현재 로그인된 유저 세션 및 기존 투표 이력 조회 (쿠키 기반 Auth)
    async function checkAuthAndVotes() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // 유저 닉네임 우선순위: 1) metadata.nickname, 2) metadata.name (소셜 계정명), 3) 이메일 앞자리
        const displayName = user.user_metadata?.nickname || user.user_metadata?.name || user.email?.split('@')[0] || "";
        if (displayName) {
          setNickname(displayName);
        }

        // 로그인 유저의 리뷰 투표 기록 조회 (vote_logs 테이블)
        const { data: votes } = await supabase
          .from('vote_logs')
          .select('target_id, vote_type')
          .eq('user_id', user.id)
          .eq('target_type', 'review');

        if (votes) {
          const voteMap: Record<string, 'like' | 'dislike'> = {};
          votes.forEach((v: any) => {
            voteMap[v.target_id] = v.vote_type;
          });
          setUserVotes(voteMap);
        }
      }
    }
    checkAuthAndVotes();
  }, []);

  useEffect(() => {
    async function fetchReviews() {
      // Supabase에서 해당 영화의 리뷰 목록을 조회합니다.
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        setReviews(initialReviews);
      } else {
        const dbReviews = data.map((r: any) => ({
          id: r.id,
          author: r.author,
          text: r.text,
          rating: r.rating,
          platform: "MovieLobby",
          isLocal: true, // 로컬 리뷰로 간주하여 추천/비추천 활성화
          date: new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          likes: r.likes,
          dislikes: r.dislikes
        }));
        setReviews([...dbReviews, ...initialReviews]);
      }
    }
    fetchReviews();
  }, [initialReviews, movieId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("별점을 선택해주세요.");
    if (!text.trim()) return alert("감상평을 작성해주세요.");

    let finalAuthor = nickname.trim();
    if (!finalAuthor) {
       const anonReviews = reviews.filter(r => r.author.startsWith("Anonymous user"));
       const maxId = anonReviews.reduce((max, r) => {
           const num = parseInt(r.author.replace("Anonymous user ", "")) || 0;
           return num > max ? num : max;
       }, 0);
       finalAuthor = `Anonymous user ${maxId + 1}`;
    }

    const newReview = {
      movie_id: movieId,
      author: finalAuthor,
      text,
      rating,
      likes: 0,
      dislikes: 0
    };

    // Supabase에 새로운 리뷰를 저장합니다.
    const insertReview = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select();

      if (error) {
        console.error("Error inserting review:", error);
        alert("리뷰 등록에 실패했습니다.");
        return;
      }

      if (data && data[0]) {
        const dbReview = {
          id: data[0].id,
          author: data[0].author,
          text: data[0].text,
          rating: data[0].rating,
          platform: "MovieLobby",
          isLocal: true,
          date: new Date(data[0].created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          likes: data[0].likes,
          dislikes: data[0].dislikes
        };
        setReviews(prev => [dbReview, ...prev]);
      }
    };
    
    insertReview();
    setText("");
    setRating(0);
    setHoverRating(0);
  };

  // 사용자 1인 1회 추천/비추천 투표 처리 함수
  const handleVote = async (reviewId: any, type: 'like' | 'dislike') => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review || !review.isLocal) return; // Supabase 저장된 리뷰만 업데이트 (isLocal = true)

    // 1. 로그인 여부 확인 (미로그인 시 투표 차단)
    if (!currentUser) {
      alert("추천/비추천은 로그인 후 이용하실 수 있습니다.");
      return;
    }

    const targetIdStr = String(reviewId);

    // 2. 이미 투표한 이력이 있는지 확인
    if (userVotes[targetIdStr]) {
      alert("이미 참여하신 리뷰입니다. (1인 1회만 참여 가능)");
      return;
    }

    // 3. vote_logs 테이블에 중복 방지 기록 저장 시도
    const { error: logError } = await supabase
      .from('vote_logs')
      .insert([{
        user_id: currentUser.id,
        target_type: 'review',
        target_id: targetIdStr,
        vote_type: type
      }]);

    if (logError) {
      if (logError.code === '23505') { // Postgres 고유키 위반 에러 (중복 방지)
        alert("이미 참여하신 리뷰입니다.");
      } else {
        console.error("Vote logging error:", logError);
        alert("추천/비추천 처리에 실패했습니다. (DB 설정을 확인해주세요)");
      }
      return;
    }

    // 4. 로컬 상태 및 DB 카운트 업데이트
    setUserVotes(prev => ({ ...prev, [targetIdStr]: type }));

    const newLikes = type === 'like' ? (review.likes || 0) + 1 : (review.likes || 0);
    const newDislikes = type === 'dislike' ? (review.dislikes || 0) + 1 : (review.dislikes || 0);

    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          likes: newLikes,
          dislikes: newDislikes
        };
      }
      return r;
    });

    setReviews(updatedReviews);

    // Supabase에 추천/비추천 카운트를 업데이트합니다.
    const { error } = await supabase
      .from('reviews')
      .update({ likes: newLikes, dislikes: newDislikes })
      .eq('id', reviewId);

    if (error) {
      console.error("Error updating vote:", error);
    }
  };

  const renderInteractiveStars = () => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((index) => {
          const value2 = index * 2;
          const value1 = value2 - 1;
          const currentVal = hoverRating || rating;
          
          let fill = "transparent";
          let color = "var(--text-muted)";
          
          // Full star
          if (currentVal >= value2) {
             return (
                <div key={index} style={{ position: 'relative', width: '32px', height: '32px' }}>
                  <Star size={32} fill="#ef4444" color="#ef4444" style={{ position: 'absolute', top: 0, left: 0 }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value1)} />
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value2)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value2)} />
                </div>
             );
          } 
          // Half star
          else if (currentVal === value1) {
             return (
                <div key={index} style={{ position: 'relative', width: '32px', height: '32px' }}>
                  <StarHalf size={32} fill="#ef4444" color="#ef4444" style={{ position: 'absolute', top: 0, left: 0 }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value1)} />
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value2)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value2)} />
                </div>
             );
          }
          // Empty star
          return (
            <div key={index} style={{ position: 'relative', width: '32px', height: '32px' }}>
              <Star size={32} color="var(--text-muted)" style={{ position: 'absolute', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value1)} />
              <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '100%', cursor: 'pointer', zIndex: 10 }} onMouseEnter={() => setHoverRating(value2)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(value2)} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderStaticStars = (score: number) => {
    const fullStars = Math.floor(score / 2);
    const hasHalfStar = score % 2 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} size={16} fill="#ef4444" color="#ef4444" />)}
        {hasHalfStar && <StarHalf key="h" size={16} fill="#ef4444" color="#ef4444" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} size={16} color="var(--card-border)" />)}
        <span style={{ marginLeft: '6px', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--foreground)' }}>{score}</span>
      </div>
    );
  };

  return (
    <div>
      <h2 className="section-title"><MessageSquare size={24} color="var(--primary)" /> Reviews</h2>
      
      {/* Review Form */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--foreground)', textAlign: 'center' }}>별점을 선택해주세요.</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          
          {/* Interactive Star Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {renderInteractiveStars()}
            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem', minHeight: '1.5rem' }}>
              {rating > 0 ? `${rating}점` : ""}
            </span>
          </div>
          
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                 type="text" 
                 value={nickname} 
                 onChange={e => setNickname(e.target.value)}
                 placeholder="User Name"
                 maxLength={20}
                 readOnly={!!currentUser}
                 style={{
                   padding: '0.6rem 1rem',
                   borderRadius: '6px',
                   border: '1px solid var(--card-border)',
                   background: currentUser ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.3)',
                   color: 'var(--foreground)',
                   outline: 'none',
                   width: '200px',
                   fontSize: '0.9rem',
                   cursor: currentUser ? 'default' : 'text'
                 }}
              />
              {currentUser && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  <UserCheck size={16} /> 로그인됨
                </span>
              )}
            </div>
            <div className="review-input-group">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="감상평을 작성해주세요."
                  maxLength={200}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--foreground)',
                    fontSize: '1rem',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: text.length >= 200 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {text.length} / 200자
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    💡 긴 감상평이나 스포일러는 상단의 <strong>Talks 참여하기</strong> 버튼을 이용해주세요!
                  </span>
                </div>
              </div>
              <button 
                type="submit"
                className="review-submit-btn"
                style={{
                  width: '90px',
                  background: 'var(--card-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}
              >
                등록
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Vertical Review List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {reviews && reviews.length > 0 ? (
          reviews.map((review: any) => (
            <div key={review.id} style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--card-border)' }}>
              
              {/* Stars and Score */}
              <div style={{ marginBottom: '0.5rem' }}>
                {renderStaticStars(review.rating || 0)}
              </div>
              
              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ 
                  padding: '2px 8px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--card-border)',
                  color: 'var(--foreground)'
                }}>관람객</span>
                <strong style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>{review.author}</strong>
                <span>•</span>
                <span>{review.date || "2026.08.13"}</span>
              </div>
              
              {/* Review Text */}
              <p style={{ color: 'var(--foreground)', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '1.2rem' }}>
                {review.text}
              </p>
              
              {/* Like / Dislike Buttons */}
              {review.isLocal && (
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button 
                    onClick={() => handleVote(review.id, 'like')}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      background: userVotes[String(review.id)] === 'like' ? 'rgba(14, 165, 233, 0.1)' : 'transparent', 
                      border: userVotes[String(review.id)] === 'like' ? '1px solid #0ea5e9' : '1px solid var(--card-border)', 
                      borderRadius: '20px', padding: '4px 12px', 
                      color: userVotes[String(review.id)] === 'like' ? '#0ea5e9' : 'var(--text-muted)', 
                      cursor: 'pointer', fontSize: '0.85rem',
                      fontWeight: userVotes[String(review.id)] === 'like' ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (userVotes[String(review.id)] !== 'like') e.currentTarget.style.color = '#0ea5e9'; }}
                    onMouseLeave={(e) => { if (userVotes[String(review.id)] !== 'like') e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <ThumbsUp size={14} /> {review.likes || 0}
                  </button>
                  <button 
                    onClick={() => handleVote(review.id, 'dislike')}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      background: userVotes[String(review.id)] === 'dislike' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
                      border: userVotes[String(review.id)] === 'dislike' ? '1px solid var(--danger)' : '1px solid var(--card-border)', 
                      borderRadius: '20px', padding: '4px 12px', 
                      color: userVotes[String(review.id)] === 'dislike' ? 'var(--danger)' : 'var(--text-muted)', 
                      cursor: 'pointer', fontSize: '0.85rem',
                      fontWeight: userVotes[String(review.id)] === 'dislike' ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (userVotes[String(review.id)] !== 'dislike') e.currentTarget.style.color = 'var(--danger)'; }}
                    onMouseLeave={(e) => { if (userVotes[String(review.id)] !== 'dislike') e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <ThumbsDown size={14} /> {review.dislikes || 0}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>아직 등록된 리뷰가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
