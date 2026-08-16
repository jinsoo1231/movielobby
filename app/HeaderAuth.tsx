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
    <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600, padding: '0.5rem 1rem', background: 'var(--accent-pink)', borderRadius: '8px' }}>
      로그인
    </Link>
  );
}
