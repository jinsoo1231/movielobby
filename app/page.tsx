"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Youtube, Search, Compass, Star } from "lucide-react";

// Mock Data
const MOCK_MOVIES = [
  { id: "1", title: "범죄도시4", rank: 1, platform: "종합", status: "playing", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80", rating: 8.5 },
  { id: "2", title: "파묘", rank: 2, platform: "종합", status: "ended", poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300&q=80", rating: 9.1 },
  { id: "3", title: "듄: 파트 2", rank: 3, platform: "종합", status: "ended", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80", rating: 9.4 },
  { id: "4", title: "스턴트맨", rank: 4, platform: "종합", status: "playing", poster: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=300&q=80", rating: 7.8 },
  { id: "5", title: "혹성탈출: 새로운 시대", rank: 5, platform: "종합", status: "playing", poster: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=300&q=80", rating: 8.0 },
  { id: "6", title: "가필드 더 무비", rank: 6, platform: "종합", status: "playing", poster: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=300&q=80", rating: 7.2 },
];

const TABS = [
  { id: "all", label: "Movie Lobby 종합 랭킹", icon: <TrendingUp size={16} /> },
  { id: "youtube", label: "YouTube 트렌드", icon: <Youtube size={16} /> },
  { id: "google", label: "Google 검색순위", icon: <Search size={16} /> },
  { id: "naver", label: "네이버 실시간", icon: <Compass size={16} /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          지금 가장 핫한 <span style={{ color: 'var(--primary)' }}>영화</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          다양한 플랫폼의 데이터를 종합하여 현재 트렌드를 한눈에 확인하세요.
        </p>
      </section>

      <section>
        <div className="tabs-container">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="movie-grid">
          {MOCK_MOVIES.map((movie) => (
            <Link href={`/movie/${movie.id}`} key={movie.id}>
              <div className="movie-card glass">
                <img src={movie.poster} alt={movie.title} className="poster" />
                
                <div className="rank-badge">{movie.rank}</div>
                
                {movie.status === "playing" ? (
                  <div className="status-badge playing">상영중</div>
                ) : (
                  <div className="status-badge ended">상영종료</div>
                )}

                <div className="info-overlay">
                  <div className="movie-title">{movie.title}</div>
                  <div className="movie-meta">
                    <Star size={14} fill="var(--accent-pink)" color="var(--accent-pink)" />
                    {movie.rating}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
