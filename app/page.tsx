'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const pledges = [
    {
      id: 'asset',
      title: '자산관리서약서',
      description: '교육기관 자산 관리 및 반납에 관한 서약서',
      path: '/pledge',
    },
    {
      id: 'code-of-conduct',
      title: '행동강령서약서',
      description: '교육생 행동강령 및 준수사항에 관한 서약서',
      path: '/code-of-conduct',
    },
    {
      id: 'privacy',
      title: '개인정보 수집/이용/제공 동의서',
      description: '개인정보 처리에 관한 동의서',
      path: '/privacy-consent',
    },
    {
      id: 'photo',
      title: '사진촬영 및 초상권 활용 동의서',
      description: '사진촬영 및 초상권 활용에 관한 동의서',
      path: '/photo-consent',
    },
    {
      id: 'project',
      title: '프로젝트 추가 편성 계획 안내 및 동의서',
      description: '프로젝트 추가 편성에 관한 안내 및 동의서',
      path: '/project-consent',
    },
  ];

  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 헤더: 로고 */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Image
            src="/wanted-logo.png"
            alt="wanted logo"
            width={96}
            height={96}
            style={{ objectFit: 'contain', marginBottom: 24 }}
            unoptimized
          />
          <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>
            어서오세요, 여기는 Wanted Potenup 입니다.
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
            포텐업 서약서
          </h1>
          <p style={{ fontSize: 16, color: '#666' }}>
            작성하실 서약서를 선택해주세요
          </p>
        </div>

        {/* 서약서 목록 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 24,
          marginTop: 48
        }}>
          {pledges.map((pledge) => (
            <Link
              key={pledge.id}
              href={pledge.path}
              style={{
                display: 'block',
                padding: '32px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#333',
                background: '#fff',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1976d2';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  color: '#1976d2'
                }}>
                  {pledge.title}
                </h2>
                <p style={{ 
                  fontSize: 14, 
                  color: '#666',
                  lineHeight: 1.6
                }}>
                  {pledge.description}
                </p>
              </div>
              <div style={{ 
                marginTop: 20, 
                fontSize: 14, 
                color: '#1976d2',
                fontWeight: 500
              }}>
                작성하기 →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

