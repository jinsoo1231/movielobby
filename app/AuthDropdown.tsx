"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut } from "lucide-react";

export default function AuthDropdown({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // metadata에서 닉네임 가져오기 (없으면 이메일 앞부분)
  const displayName = user.user_metadata?.nickname || user.user_metadata?.name || user.email?.split('@')[0] || "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}
      >
        <User size={18} />
        {displayName}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#19191E', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.5rem', width: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100 }}>
          <Link 
            href="/mypage" 
            onClick={() => setIsOpen(false)}
            style={{ display: 'block', padding: '0.8rem 1rem', color: '#fff', textDecoration: 'none', borderRadius: '8px', marginBottom: '4px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            마이페이지
          </Link>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem 1rem', color: '#ff6b6b', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
