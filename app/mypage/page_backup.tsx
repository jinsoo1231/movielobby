"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Film, Clock, Eye, MessageSquare, ArrowRight } from "lucide-react";

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);
      const nickname = user.user_metadata?.nickname || user.email?.split('@')[0] || "User";

      // Fetch my posts
      const { data: posts } = await supabase
        .from('talk_posts')
        .select('*')
        .eq('author', nickname)
        .order('created_at', { ascending: false });

      if (posts) {
        setMyPosts(posts);
      }
      
      setLoading(false);
    };

    fetchUserData();
  }, [router, supabase]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>로딩 중...</div>;
  }

  const nickname = user?.user_metadata?.nickname || user?.email?.split('@')[0] || "User";

  return (
    <div className="animate-fade-in container" style={{ paddingBottom: '4rem', paddingTop: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <User size={28} color="var(--primary)" /> 마이페이지
      </h1>

      {/* User Profile */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          {nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{nickname}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Mail size={16} /> {user?.email}
          </div>
        </div>
      </div>

      {/* My Posts */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} color="var(--accent-pink)" /> 내가 작성한 게시글
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myPosts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              아직 작성한 게시글이 없습니다.
            </div>
          ) : (
            myPosts.map(post => (
              <Link 
                key={post.id} 
                href={`/talks/${post.movie_id}/${post.id}?title=${encodeURIComponent(post.movie_title)}`}
                style={{ display: 'block', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {post.is_spoiler && <span style={{ fontSize: '0.8rem', background: 'rgba(255,0,0,0.2)', color: '#ff6b6b', padding: '2px 6px', borderRadius: '4px' }}>스포일러</span>}
                    {post.title}
                  </h4>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Film size={14} /> {post.movie_title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {new Date(post.created_at).toLocaleDateString()}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Eye size={14} /> {post.views || 0}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
