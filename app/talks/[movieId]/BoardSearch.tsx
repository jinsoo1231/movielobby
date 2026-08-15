"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function BoardSearch({ movieId, movieTitle, moviePoster }: { movieId: number, movieTitle: string, moviePoster: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchType, setSearchType] = useState(searchParams.get("type") || "title");
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      // If empty query, reset search
      router.push(`/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}`);
      return;
    }
    
    router.push(`/talks/${movieId}?title=${encodeURIComponent(movieTitle)}&poster=${encodeURIComponent(moviePoster)}&type=${searchType}&q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
      <div style={{ display: 'flex', border: '1px solid var(--card-border)', borderRadius: '4px', overflow: 'hidden', background: 'var(--card-bg)' }}>
        
        <select 
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            border: 'none', 
            borderRight: '1px solid var(--card-border)',
            background: 'transparent',
            color: 'var(--foreground)',
            outline: 'none',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <option value="title">제목만</option>
          <option value="content">본문만</option>
          <option value="title_content">제목+본문</option>
          <option value="author">작성자</option>
        </select>
        
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력해주세요"
          style={{
            padding: '0.6rem 1rem',
            border: 'none',
            background: 'transparent',
            color: 'var(--foreground)',
            outline: 'none',
            minWidth: '250px',
            fontSize: '0.95rem'
          }}
        />
        
        <button 
          type="submit"
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '0 1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search size={18} />
        </button>
        
      </div>
    </form>
  );
}
