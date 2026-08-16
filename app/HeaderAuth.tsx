import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AuthDropdown from "./AuthDropdown";

export default async function HeaderAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <AuthDropdown user={user} />;
  }

  return (
    <Link 
      href="/login" 
      style={{ 
        color: '#ffffff', 
        textDecoration: 'none', 
        fontWeight: 600, 
        fontSize: '0.9rem',
        padding: '0.45rem 1.1rem', 
        background: 'rgba(255, 255, 255, 0.12)', 
        border: '1px solid rgba(255, 255, 255, 0.25)', 
        borderRadius: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 0.2s ease'
      }}
    >
      로그인
    </Link>
  );
}
