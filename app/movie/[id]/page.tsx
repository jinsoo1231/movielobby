import Link from "next/link";
import { Play, ArrowLeft, Star, Clock, Calendar, MessageSquare, Youtube } from "lucide-react";
import FranchiseTimeline from "./FranchiseTimeline";
import InteractiveReviews from "./InteractiveReviews";

async function getMovieDetail(id: string) {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN;
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=ko-KR&append_to_response=credits,videos,images`, {
      headers,
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    // Fetch english reviews since korean reviews are very sparse
    const reviewsRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/reviews?language=en-US`, { headers, next: { revalidate: 3600 } });
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { results: [] };
    
    // Fetch franchise if exists
    let franchise: any[] = [];
    if (data.belongs_to_collection) {
      const colRes = await fetch(`https://api.themoviedb.org/3/collection/${data.belongs_to_collection.id}?language=ko-KR`, { headers });
      if (colRes.ok) {
        const colData = await colRes.json();
        franchise = (colData.parts || [])
          .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
          .map((part: any) => ({
            id: part.id,
            title: part.title,
            year: part.release_date ? part.release_date.substring(0, 4) : "미정",
            poster: part.poster_path ? `https://image.tmdb.org/t/p/w200${part.poster_path}` : "https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster",
            plot: part.overview,
            rating: part.vote_average ? part.vote_average.toFixed(1) : "0.0"
          }));
      }
    }

    // Extract director and cast
    const director = data.credits?.crew?.find((c: any) => c.job === "Director")?.name || "알 수 없음";
    const cast = (data.credits?.cast || []).slice(0, 4).map((c: any) => c.name);
    
    // Extract trailer
    const trailer = data.videos?.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
    
    // Extract images
    const gallery = (data.images?.backdrops || []).slice(0, 4).map((img: any) => `https://image.tmdb.org/t/p/w500${img.file_path}`);

    // Extract reviews
    const reviews = (reviewsData.results || []).map((r: any) => ({
      id: r.id,
      author: r.author,
      text: r.content,
      rating: r.author_details?.rating || null,
      platform: "TMDB"
    }));

    return {
      id: data.id,
      title: data.title,
      genres: (data.genres || []).map((g: any) => g.name),
      runtime: `${data.runtime || 0}분`,
      releaseDate: data.release_date || "미정",
      rating: data.vote_average ? data.vote_average.toFixed(1) : "0.0",
      director,
      cast,
      synopsis: data.overview || "시놉시스가 제공되지 않습니다.",
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "https://via.placeholder.com/300x450/19191E/FFFFFF?text=No+Poster",
      backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : "https://via.placeholder.com/1200x600/19191E/FFFFFF?text=No+Backdrop",
      trailerId: trailer?.key,
      gallery,
      franchise,
      reviews
    };
  } catch (e) {
    console.error("Failed to fetch movie detail", e);
    return null;
  }
}

export default async function MovieDetail({ 
  params,
  searchParams,
}: { 
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { year, page } = searchParams || {};
  const backHref = year && page ? `/?year=${year}&page=${page}` : "/";

  const movie = await getMovieDetail(params.id);

  if (!movie) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h2>영화 정보를 불러올 수 없습니다.</h2>
        <Link href={backHref} style={{ color: 'var(--primary)', marginTop: '1rem', display: 'inline-block' }}>메인으로 돌아가기</Link>
      </div>
    );
  }

  // Real reviews fetched from TMDB

  return (
    <div className="animate-fade-in">
      {/* Banner Section */}
      <div className="detail-banner">
        <img src={movie.backdrop} alt="backdrop" className="backdrop" />
        <div className="container" style={{ width: '100%' }}>
          <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> 목록으로 돌아가기
          </Link>
          <div className="detail-content">
            <img src={movie.poster} alt={movie.title} className="detail-poster" />
            <div className="detail-info">
              <h1 className="detail-title">{movie.title}</h1>
              <div>
                {movie.genres.map((g: string) => <span key={g} className="tag">{g}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Star size={16} color="var(--accent-pink)" /> {movie.rating}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {movie.runtime}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> {movie.releaseDate}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                <p><strong>감독:</strong> {movie.director}</p>
                <p><strong>출연:</strong> {movie.cast.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        
        {/* Synopsis Section */}
        <h2 className="section-title">시놉시스</h2>
        <p className="synopsis">{movie.synopsis}</p>

        {/* Media Section */}
        <h2 className="section-title"><Play size={24} color="var(--primary)" /> 트레일러 & 미디어</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            {movie.trailerId ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${movie.trailerId}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                <Youtube size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                <p>제공되는 트레일러가 없습니다.</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '100%' }}>
            {movie.gallery.length > 0 ? movie.gallery.map((img: string, i: number) => (
              <img key={i} src={img} alt="still cut" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
            )) : <p style={{ color: 'var(--text-muted)' }}>제공되는 스틸컷이 없습니다.</p>}
          </div>
        </div>

        {/* Franchise Timeline Section */}
        <FranchiseTimeline franchise={movie.franchise} />

        {/* Reviews Feed Section */}
        <InteractiveReviews initialReviews={movie.reviews} movieId={movie.id} />
      </div>
    </div>
  );
}
