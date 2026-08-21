import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          <span>메인으로 돌아가기</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <ShieldCheck size={32} color="var(--primary)" />
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>개인정보 처리방침</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>시행일자: 2026년 08월 21일</p>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '12px', lineHeight: '1.7', color: 'var(--text-main)' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>1. 개인정보의 수집 및 이용 목적</h2>
          <p>MovieLobby(무비로비)는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>홈페이지 회원 가입 및 관리: 서비스 이용 의사 확인, 회원제 서비스 제공에 따른 본인 식별 및 인증, 회원 자격 유지 및 관리, 서비스 부정이용 방지</li>
            <li>서비스 제공: 커뮤니티(게시판), 영화 리뷰 작성 등 맞춤형 서비스 제공</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>2. 수집하는 개인정보 항목</h2>
          <p>MovieLobby는 원활한 서비스 제공을 위해 최소한의 개인정보를 수집하고 있습니다.</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>필수항목: 이메일 주소, 비밀번호, 닉네임 (소셜 로그인 시 연동되는 식별정보 포함)</li>
            <li>자동수집항목: 서비스 이용 기록, 접속 로그, 쿠키(Cookie), IP 주소</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>3. 개인정보의 처리 및 보유 기간</h2>
          <p>회사는 법령에 따른 개인정보 보유 및 이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유 및 이용기간 내에서 개인정보를 처리 및 보유합니다.</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>회원 탈퇴 시 즉시 파기 (단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보존)</li>
            <li>부정이용 기록은 탈퇴일로부터 1년간 보존 후 파기</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>4. 제3자 제공 및 위탁</h2>
          <p>MovieLobby는 원칙적으로 사용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>사용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 적법한 절차와 방법에 따라 요구가 있는 경우</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>5. 정보주체의 권리와 그 행사방법</h2>
          <p>사용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 수집 및 이용 동의를 철회할 수 있습니다. 마이페이지 내 '회원 정보 수정' 또는 '회원 탈퇴' 메뉴를 통해 직접 권리를 행사하실 수 있습니다.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>6. 개인정보 보호책임자</h2>
          <p>MovieLobby는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <p><strong>책임자:</strong> MovieLobby 운영팀</p>
            <p><strong>이메일:</strong> movielobby.official@gmail.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
