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
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(255, 255, 255, 0.1)', 
          border: '1px solid rgba(255, 255, 255, 0.25)', 
          color: '#ffffff', 
          padding: '0.45rem 1rem', 
          borderRadius: '20px', 
          cursor: 'pointer', 
          fontWeight: 600,
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.2s ease'
        }}
      >
        <User size={16} />
        <span style={{ 
          maxWidth: '120px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          display: 'inline-block'
        }}>
          {displayName}
        </span>
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 8px)', 
          right: 0, 
          background: '#0a2342', 
          border: '1px solid rgba(255, 255, 255, 0.15)', 
          borderRadius: '12px', 
          padding: '0.5rem', 
          width: '170px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)', 
          zIndex: 100 
        }}>
          <Link 
            href="/mypage" 
            onClick={() => setIsOpen(false)}
            style={{ 
              display: 'block', 
              padding: '0.65rem 0.9rem', 
              color: '#ffffff', 
              textDecoration: 'none', 
              borderRadius: '8px', 
              marginBottom: '2px', 
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            마이페이지
          </Link>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              width: '100%', 
              padding: '0.65rem 0.9rem', 
              color: '#ff6b6b', 
              background: 'transparent', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              textAlign: 'left', 
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={15} /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
