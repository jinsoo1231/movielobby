"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Clock, Eye, ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

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

  const handleLike = async () => {
    if (!post) return;
    const newLikes = (post.likes || 0) + 1;
    await supabase.from('talk_posts').update({ likes: newLikes }).eq('id', postId);
    setPost({ ...post, likes: newLikes });
  };

  const handleDislike = async () => {
    if (!post) return;
    const newDislikes = (post.dislikes || 0) + 1;
    await supabase.from('talk_posts').update({ dislikes: newDislikes }).eq('id', postId);
    setPost({ ...post, dislikes: newDislikes });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentContent.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('talk_comments')
      .insert([{ post_id: postId, author: commentAuthor.trim(), content: commentContent.trim() }])
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
          <button onClick={handleLike} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ padding: '1rem', borderRadius: '50%', border: '2px solid var(--accent-pink)' }}>
              <ThumbsUp size={24} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{post.likes || 0}</span>
          </button>

          <button onClick={handleDislike} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ padding: '1rem', borderRadius: '50%', border: '2px solid var(--text-muted)' }}>
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
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="닉네임" 
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', width: '150px' }}
              disabled={isSubmitting}
            />
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
