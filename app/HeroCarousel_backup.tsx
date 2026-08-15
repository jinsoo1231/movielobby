"use client";

import { useState, useRef } from "react";
import { Play, ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";

export default function HeroCarousel({ movies }: { movies: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -window.innerWidth, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: window.innerWidth, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section style={{ position: 'relative', width: '100vw', height: '70vh', minHeight: '500px', overflow: 'hidden' }}>
      
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', /* Hide scrollbar for Firefox */
          msOverflowStyle: 'none', /* Hide scrollbar for IE */
        }}
        className="hide-scrollbar"
      >
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            style={{
              flex: '0 0 100%',
              width: '100vw',
              height: '100%',
              position: 'relative',
              scrollSnapAlign: 'start',
              backgroundImage: playingId !== movie.id ? `url(${movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://via.placeholder.com/1200x600/19191E/FFFFFF?text=No+Backdrop'})` : 'none',
              backgroundColor: '#000',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Video Player */}
            {playingId === movie.id ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${movie.trailerId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
              />
            ) : (
              /* Overlay Content */
              <>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)',
                  zIndex: 1
                }} />
                
                <div className="container" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <div style={{ maxWidth: '600px', color: '#fff' }}>
                    <h1 className="hero-title" style={{ marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      {movie.title || movie.name}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {movie.overview || "시놉시스가 제공되지 않습니다."}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {movie.trailerId && (
                        <button 
                          onClick={() => setPlayingId(movie.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.8rem 1.5rem', borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.9)', color: '#000',
                            fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
                        >
                          <Play size={20} fill="#000" /> 재생
                        </button>
                      )}
                      <Link 
                        href={`/movie/${movie.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.8rem 1.5rem', borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                          transition: 'all 0.2s', textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                      >
                        <Info size={20} /> 상세정보
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={scrollLeft}
        style={{
          position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)',
          width: '50px', height: '50px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10, transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
      >
        <ChevronLeft size={30} />
      </button>

      <button 
        onClick={scrollRight}
        style={{
          position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)',
          width: '50px', height: '50px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10, transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
      >
        <ChevronRight size={30} />
      </button>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
