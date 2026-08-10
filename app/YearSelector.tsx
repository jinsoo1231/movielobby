"use client";

import { useRouter } from "next/navigation";

export default function YearSelector({ currentYear }: { currentYear: number }) {
  const router = useRouter();
  
  // Generate a list of years from current year down to 2000
  const currentRealYear = new Date().getFullYear();
  const years = Array.from({ length: currentRealYear - 1999 }, (_, i) => currentRealYear - i);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    router.push(`/?year=${year}&page=1`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>연도 선택:</span>
      <select 
        value={currentYear} 
        onChange={handleChange}
        style={{
          background: 'var(--card-bg)',
          color: 'var(--foreground)',
          border: '1px solid var(--card-border)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '1rem',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        {years.map(y => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>
    </div>
  );
}
