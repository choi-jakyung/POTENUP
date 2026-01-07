'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const pledges = [
    {
      id: 'asset',
      title: '💼 자산관리서약서',
      description: '교육기관 자산 관리 및 반납에 관한 서약서',
      path: '/pledge',
    },
    {
      id: 'asset-receipt',
      title: '📦 자산 지급수령/반납확인서',
      description: '자산 수령 및 반납에 관한 확인서',
      path: '/asset-receipt',
    },
    {
      id: 'code-of-conduct',
      title: '📜 행동강령서약서',
      description: '교육생 행동강령 및 준수사항에 관한 서약서',
      path: '/code-of-conduct',
    },
    {
      id: 'code-pledge',
      title: '✍️ 행동 강령 서약서',
      description: '교육 기간 중 준수해야 할 행동 강령 서약서',
      path: '/code-pledge',
    },
    {
      id: 'privacy',
      title: '🔒 개인정보 수집/이용/제공 동의서',
      description: '개인정보 처리에 관한 동의서',
      path: '/privacy-consent',
    },
    {
      id: 'photo',
      title: '📷 사진촬영 및 초상권 활용 동의서',
      description: '사진촬영 및 초상권 활용에 관한 동의서',
      path: '/photo-consent',
    },
    {
      id: 'project',
      title: '📊 프로젝트 추가 편성 계획 안내 및 동의서',
      description: '프로젝트 추가 편성에 관한 안내 및 동의서',
      path: '/project-consent',
    },
  ];

  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* 오른쪽 상단 POTENUP 로고 */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          zIndex: 10,
          background: '#000',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <Link href="/">
            <Image
              src="/POTENUP B.png"
              alt="POTENUP logo"
              width={96}
              height={96}
              style={{ objectFit: 'contain', display: 'block' }}
              unoptimized
            />
          </Link>
        </div>

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
                e.currentTarget.style.background = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  marginBottom: 8,
                  color: '#1976d2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
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

        {/* 푸터 */}
        <footer style={{ 
          marginTop: 80, 
          paddingTop: 32, 
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ fontSize: 14, color: '#999' }}>
            © 2026 Wanted Lab, Inc.
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://www.instagram.com/wantedlab.official" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/wantedlab" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@wantedlab" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://blog.naver.com/wantedlab" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
            </a>
            <a href="https://apps.apple.com/app/wanted" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.wanted" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

