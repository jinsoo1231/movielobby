"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Clock, Eye, ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TalkPostDetailPage({ 
  params,
  searchParams
}: { 
  params: { movieId: string; postId: string };
  searchParams: { title?: string; poster?: string };
}) {
  const movieId = parseInt(params.movieId);
  const postId = params.postId;
  const movieTitle = searchParams.title || "영화";
  const moviePoster = searchParams.poster || "https://via.placeholder.com/150x225/19191E/FFFFFF?text=No+Poster";

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userNickname, setUserNickname] = useState("");
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setUserNickname(user.user_metadata?.nickname || user.email?.split('@')[0] || "User");

        // 로그인 유저의 게시글 투표 이력 조회
        const { data: voteData } = await supabase
          .from('vote_logs')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .eq('target_id', postId)
          .maybeSingle();

        if (voteData) {
          setUserVote(voteData.vote_type as 'like' | 'dislike');
        }
      }
      await fetchPostAndComments();
    };
    init();
  }, [postId, supabase.auth]);

  const fetchPostAndComments = async () => {
    // 1. Fetch Post
    const { data: postData } = await supabase
      .from('talk_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postData) {
      // 2. Increment view count (only once per load)
      const newViews = (postData.views || 0) + 1;
      await supabase.from('talk_posts').update({ views: newViews }).eq('id', postId);
      setPost({ ...postData, views: newViews });
    }

    // 3. Fetch Comments
    const { data: commentsData } = await supabase
      .from('talk_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData) {
      setComments(commentsData);
    }
    
    setLoading(false);
  };

  // 사용자 1인 1회 추천/비추천 투표 처리 함수
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!post) return;

    // 1. 로그인 여부 확인
    if (!currentUser) {
      alert("추천/비추천은 로그인 후 이용하실 수 있습니다.");
      return;
    }

    // 2. 이미 투표한 이력이 있는지 확인
    if (userVote) {
      alert("이미 참여하신 게시글입니다. (1인 1회만 참여 가능)");
      return;
    }

    // 3. vote_logs 테이블에 중복 방지 기록 저장 시도
    const { error: logError } = await supabase
      .from('vote_logs')
      .insert([{
        user_id: currentUser.id,
        target_type: 'post',
        target_id: postId,
        vote_type: type
      }]);

    if (logError) {
      if (logError.code === '23505') {
        alert("이미 참여하신 게시글입니다.");
      } else {
        console.error("Vote logging error:", logError);
        alert("추천/비추천 처리에 실패했습니다. (DB 설정을 확인해주세요)");
      }
      return;
    }

    // 4. 로컬 상태 및 DB 카운트 업데이트
    setUserVote(type);

    if (type === 'like') {
      const newLikes = (post.likes || 0) + 1;
      await supabase.from('talk_posts').update({ likes: newLikes }).eq('id', postId);
      setPost({ ...post, likes: newLikes });
    } else {
      const newDislikes = (post.dislikes || 0) + 1;
      await supabase.from('talk_posts').update({ dislikes: newDislikes }).eq('id', postId);
      setPost({ ...post, dislikes: newDislikes });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('talk_comments')
      .insert([{ post_id: postId, author: userNickname, content: commentContent.trim() }])
      .select();

    if (!error && data) {
      setComments([...comments, data[0]]);
      setCommentContent("");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>로딩 중...</div>;
  }

  if (!post) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="animate-fade-in container" style={{ paddingBottom: '4rem', paddingTop: '2rem', maxWidth: '800px' }}>
      
      <Link href={`/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> 게시판 목록으로
      </Link>

      {/* Post Content */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {post.is_spoiler && (
            <span style={{ background: 'rgba(255, 0, 0, 0.2)', color: '#ff6b6b', fontSize: '1rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ff6b6b', flexShrink: 0 }}>
              스포일러
            </span>
          )}
          {post.title}
        </h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} /> {post.author}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {new Date(post.created_at).toLocaleString()}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}><Eye size={16} /> 조회수 {post.views}</span>
        </div>

        <div style={{ fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#e0e0e0', minHeight: '150px' }}>
          {post.is_spoiler && !showSpoiler ? (
            <div style={{ position: 'relative', minHeight: '200px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ filter: 'blur(8px)', userSelect: 'none', opacity: 0.3, padding: '1.5rem', height: '200px' }}>
                {post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowSpoiler(true)} 
                  style={{ background: 'var(--accent-pink)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                >
                  🚨 스포일러 포함된 글입니다 (클릭해서 보기)
                </button>
              </div>
            </div>
          ) : (
            post.content
          )}
        </div>

        {/* Voting Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => handleVote('like')} 
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', 
              background: 'none', border: 'none', 
              color: userVote === 'like' ? 'var(--accent-pink)' : 'var(--text-muted)', 
              cursor: 'pointer', transition: 'transform 0.2s' 
            }} 
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} 
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ 
              padding: '1rem', borderRadius: '50%', 
              border: `2px solid ${userVote === 'like' ? 'var(--accent-pink)' : 'var(--card-border)'}`,
              background: userVote === 'like' ? 'rgba(236, 72, 153, 0.15)' : 'transparent'
            }}>
              <ThumbsUp size={24} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{post.likes || 0}</span>
          </button>

          <button 
            onClick={() => handleVote('dislike')} 
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', 
              background: 'none', border: 'none', 
              color: userVote === 'dislike' ? 'var(--danger)' : 'var(--text-muted)', 
              cursor: 'pointer', transition: 'transform 0.2s' 
            }} 
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} 
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ 
              padding: '1rem', borderRadius: '50%', 
              border: `2px solid ${userVote === 'dislike' ? 'var(--danger)' : 'var(--card-border)'}`,
              background: userVote === 'dislike' ? 'rgba(239, 68, 68, 0.15)' : 'transparent'
            }}>
              <ThumbsDown size={24} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{post.dislikes || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '16px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', margin: '0 0 2rem 0' }}>
          <MessageSquare size={24} color="var(--primary)" /> 댓글 {comments.length}개
        </h2>

        {/* Comment Form */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userNickname}
              </div>
              <input 
                type="text" 
                placeholder="자유롭게 댓글을 남겨보세요!" 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none' }}
                disabled={isSubmitting}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                <Send size={18} /> 등록
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>댓글을 작성하려면 <Link href="/login" style={{ color: 'var(--accent-pink)', textDecoration: 'none', fontWeight: 'bold' }}>로그인</Link>이 필요합니다.</span>
          </div>
        )}

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{comment.author}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div style={{ color: '#ddd', lineHeight: '1.5' }}>
                  {comment.content}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>첫 번째 댓글을 남겨주세요!</p>
          )}
        </div>
      </div>
    </div>
  );
}
