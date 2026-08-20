"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, KeyRound } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // [제1조 2항 준수] 세션 확인 로직
  // 비밀번호 재설정 메일의 링크를 클릭하여 이 페이지로 진입하면, 
  // Supabase가 URL의 해시(#) 토큰을 읽어 자동으로 세션을 생성합니다.
  // 이 세션이 없으면 정상적인 접근이 아니므로 로그인 페이지로 돌려보냅니다.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("유효하지 않은 접근이거나 링크가 만료되었습니다.");
      }
    };
    checkSession();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    // 새 비밀번호로 업데이트 요청
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage("비밀번호가 성공적으로 변경되었습니다! 잠시 후 홈페이지로 이동합니다.");
      // 변경 완료 후 세션을 안전하게 정리하고 홈페이지로 이동 (모바일에서 다시 로그인 유도)
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/");
      }, 3000);
    }
  };

  return (
    <div className="animate-fade-in container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: '2rem 0' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>새 비밀번호 설정</h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          앞으로 사용하실 새로운 비밀번호를 입력해주세요.
        </p>

        {error && (
          <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'rgba(0,255,0,0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
              새 비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.8rem 1rem 0.8rem 2.5rem', 
                  borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  fontSize: '1rem'
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
              비밀번호 확인
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 한 번 입력하세요"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.8rem 1rem 0.8rem 2.5rem', 
                  borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  fontSize: '1rem'
                }} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !!message}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              marginTop: '1rem', 
              fontSize: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? "변경 중..." : <><KeyRound size={18} /> 비밀번호 변경하기</>}
          </button>
        </form>
      </div>
    </div>
  );
}
