"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '300px', display: 'flex' }}>
      <input 
        type="text" 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search movies..."
        style={{
          width: '100%',
          padding: '0.4rem 2.5rem 0.4rem 1rem',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)',
          fontSize: '0.9rem',
          color: '#fff',
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
          background: 'transparent',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        <Search size={16} strokeWidth={2.5} />
      </button>
    </form>
  );
}
