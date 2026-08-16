"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Check } from "lucide-react";

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 이미 닉네임이 있는지 확인
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else if (user.user_metadata?.nickname) {
        router.push("/");
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nickname.trim().length < 2) {
      setError("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { nickname: nickname.trim() }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: '2rem 0' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '1rem' }}>환영합니다! 🎉</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
          MovieLobby 커뮤니티에서 사용할<br />멋진 닉네임을 설정해주세요.
        </p>

        {error && (
          <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="닉네임 (2자 이상)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              minLength={2}
              maxLength={15}
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f8fafc', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            <Check size={20} /> {loading ? "설정 중..." : "설정 완료하고 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
