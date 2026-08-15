"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '1000px' }}>
      <input 
        type="text" 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a movie, tv show, person......"
        style={{
          width: '100%',
          padding: '1rem 8rem 1rem 1.5rem',
          borderRadius: '30px',
          border: 'none',
          fontSize: '1.1rem',
          outline: 'none',
          color: '#000'
        }}
      />
      <button 
        type="submit"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          background: 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          borderRadius: '30px',
          padding: '0 2rem',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Search
      </button>
    </form>
  );
}
