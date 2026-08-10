"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ArrowLeft, Star, Clock, Calendar, MessageSquare, X } from "lucide-react";

// Mock Data
const MOVIE_DETAILS = {
  id: "1",
  title: "범죄도시4",
  genres: ["액션", "범죄"],
  runtime: "109분",
  releaseDate: "2024.04.24",
  rating: 8.5,
  director: "허명행",
  cast: ["마동석", "김무열", "박지환", "이동휘"],
  synopsis: "신종 마약 사건 3년 뒤, 괴물형사 '마석도'(마동석)와 서울 광수대는 배달앱을 이용한 마약 판매 사건을 수사하던 중 앱 개발자가 필리핀에서 사망한 사건이 대규모 온라인 불법 도박 조직과 연관되어 있음을 알아낸다...",
  poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  backdrop: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1200&q=80",
  trailerId: "R-nZ7-Z93b0", // Mock youtube ID
  gallery: [
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&q=80"
  ],
  reviews: [
    { id: 1, author: "영화조아", text: "마동석의 타격감은 여전히 통쾌하다!", rating: 9, platform: "Naver" },
    { id: 2, author: "ActionFan", text: "빌런이 조금 아쉽지만 킬링타임으로 최고", rating: 7, platform: "YouTube" },
    { id: 3, author: "Cinephile", text: "시리즈의 장점을 잘 살린 팝콘무비", rating: 8, platform: "MovieLobby" }
  ],
  franchise: [
    { id: "p1", title: "범죄도시", year: "2017", poster: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=200&q=80", plot: "가리봉동 소탕작전", rating: 9.2 },
    { id: "p2", title: "범죄도시2", year: "2022", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&q=80", plot: "베트남 납치 살해범 검거", rating: 9.0 },
    { id: "p3", title: "범죄도시3", year: "2023", poster: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=200&q=80", plot: "신종 마약 범죄 소탕", rating: 8.1 },
    { id: "p4", title: "범죄도시4", year: "2024", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80", plot: "온라인 불법 도박 조직 소탕", rating: 8.5 }
  ]
};

export default function MovieDetail({ params }: { params: { id: string } }) {
  const [modalData, setModalData] = useState<any>(null);

  // In a real app, you'd fetch data based on params.id
  const movie = MOVIE_DETAILS;

  return (
    <div className="animate-fade-in">
      {/* Banner Section */}
      <div className="detail-banner">
        <img src={movie.backdrop} alt="backdrop" className="backdrop" />
        <div className="container" style={{ width: '100%' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> 목록으로 돌아가기
          </Link>
          <div className="detail-content">
            <img src={movie.poster} alt={movie.title} className="detail-poster" />
            <div className="detail-info">
              <h1 className="detail-title">{movie.title}</h1>
              <div>
                {movie.genres.map(g => <span key={g} className="tag">{g}</span>)}
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
            <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              <Youtube size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
              <p>YouTube 트레일러 임베드 영역</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '100%' }}>
            {movie.gallery.map((img, i) => (
              <img key={i} src={img} alt="still cut" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
            ))}
          </div>
        </div>

        {/* Franchise Timeline Section */}
        {movie.franchise && movie.franchise.length > 0 && (
          <>
            <h2 className="section-title">시리즈 타임라인</h2>
            <div className="timeline-container">
              {movie.franchise.map((item) => (
                <div key={item.id} className="timeline-item" onClick={() => setModalData(item)}>
                  <img src={item.poster} alt={item.title} className="timeline-poster" />
                  <div className="timeline-title">{item.title}</div>
                  <div className="timeline-year">{item.year}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reviews Feed Section */}
        <h2 className="section-title"><MessageSquare size={24} color="var(--primary)" /> 실시간 리뷰</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {movie.reviews.map(review => (
            <div key={review.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {review.author}
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'normal' }}>
                    {review.platform}
                  </span>
                </strong>
                <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>★ {review.rating}</span>
              </div>
              <p style={{ color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.5' }}>{review.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Franchise Modal */}
      {modalData && (
        <div className="modal-overlay" onClick={() => setModalData(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalData(null)}>
              <X size={24} />
            </button>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <img src={modalData.poster} alt={modalData.title} style={{ width: '120px', borderRadius: '8px' }} />
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{modalData.title} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({modalData.year})</span></h3>
                <div style={{ color: 'var(--accent-pink)', marginBottom: '1rem', fontWeight: 'bold' }}>★ {modalData.rating}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{modalData.plot}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
