"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function FranchiseTimeline({ franchise }: { franchise: any[] }) {
  const [modalData, setModalData] = useState<any>(null);

  if (!franchise || franchise.length === 0) return null;

  return (
    <>
      <h2 className="section-title">시리즈 타임라인</h2>
      <div className="timeline-container">
        {franchise.map((item) => (
          <div key={item.id} className="timeline-item" onClick={() => setModalData(item)}>
            <img src={item.poster} alt={item.title} className="timeline-poster" />
            <div className="timeline-title">{item.title}</div>
            <div className="timeline-year">{item.year}</div>
          </div>
        ))}
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{modalData.plot || "줄거리가 제공되지 않습니다."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
