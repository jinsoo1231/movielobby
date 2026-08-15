"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function TalksSearchForm() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/talks/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
      <input 
        type="text" 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="토론하고 싶은 영화 제목을 검색해보세요..."
        style={{
          width: '100%',
          padding: '1.2rem 4rem 1.2rem 1.5rem',
          borderRadius: '30px',
          background: '#fff',
          fontSize: '1.1rem',
          color: '#333',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: 'none',
          outline: 'none',
        }}
      />
      <button 
        type="submit"
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        <Search size={20} strokeWidth={2.5} />
      </button>
    </form>
  );
}
