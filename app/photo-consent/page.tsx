'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정'
];

// 연락처 포맷팅 함수 (010-0000-0000 형식)
const formatPhoneNumber = (value: string) => {
  // 숫자만 추출
  const numbers = value.replace(/[^\\d]/g, '');
  
  // 11자리 초과 시 제한
  const limitedNumbers = numbers.slice(0, 11);
  
  // 형식 적용
  if (limitedNumbers.length <= 3) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
  } else {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
  }
};

export default function PhotoConsentPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('010-0000-0000');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isContactFocused, setIsContactFocused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const end = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const isFormValid = () => {
    const isContactValid = contact.trim() !== '' && contact !== '010-0000-0000' && contact.length >= 13;
    return (
      course !== '' &&
      name.trim() !== '' &&
      address.trim() !== '' &&
      isContactValid &&
      hasSignature &&
      agreed
    );
  };
  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article style={{ maxWidth: 860, margin: '0 auto', fontSize: 14, lineHeight: 1.9 }}>
        <div style={{ marginBottom: 16 }}>
          <Image src="/wanted-logo.png" alt="wanted logo" width={96} height={96} style={{ objectFit: 'contain' }} unoptimized />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' }}>
          사진 촬영 및 초상권 활용 동의서
        </h1>

        <p>
          (주)원티드랩에서 주관하는 포텐업 교육 과정과 관련하여, 활동 모습 및 결과물을 홍보 자료 및 기록 자료로
          활용하는 것을 아래와 같이 사전동의를 구하며 본인은 이에 동의합니다.
        </p>

        <div style={{ marginTop: 20, borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
              1. 사진 촬영 활용 목적
            </div>
            <div style={{ padding: '10px 14px', flex: 1 }}>
              - 프로그램 운영 및 홍보
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
              2. 사용 형태
            </div>
            <div style={{ padding: '10px 14px', flex: 1 }}>
              - 홍보 자료 및 공식 SNS(유튜브, 홈페이지, 인스타그램 등)
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30, marginBottom: 30 }}>
          <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            본인은 사진 및 영상물 위와같이 촬영 및 활용할 권리를 허락합니다.
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            본인은 (주)원티드랩에서 촬영한 사진, 영상물, 영상물을 합쳐 서명한 사진의 판권(저작권) 및 소유권이 (주)원티드랩에 있음을 동의합니다.
          </p>
          <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            본인은 촬영한 저작물에 개인정보(이름, 나이 등)가 노출될 수 있음을 허락합니다.
          </p>
        </div>

        <section style={{ marginTop: 40 }}>
          {/* 입력 영역 */}
          <div style={{ marginTop: 40, border: '1px solid #eee', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
              {/* 서명일 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>서&nbsp;&nbsp;명&nbsp;&nbsp;일 :</span>
                <input 
                  type="date" 
                  defaultValue="2025-12-21" // 기본값 설정 (필요에 따라 동적으로 변경 가능)
                  style={{ 
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    flex: 1,
                    minWidth: 150,
                  }} 
                />
              </label>

              {/* 교육명 아코디언 */}
              <div style={{ position: 'relative' }} data-course-dropdown>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>교육명 :</span>
                  <div style={{ position: 'relative', flex: 1 }} data-course-dropdown>
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        background: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 14,
                        minWidth: 150,
                      }}
                    >
                      <span>{course || '선택'}</span>
                      <span>
                        ▲
                      </span>
                    </button>
                  </div>
                </label>
              </div>
            </div>

            {/* 성명 입력 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 :</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="성명을 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  flex: 1,
                }}
              />
            </label>

            {/* 정자서명란 */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>정자서명란 :</span>
                <span style={{ fontSize: 14 }}>(인)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ minWidth: 80, fontSize: 14 }}></span> {/* 정렬을 위한 빈 span */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: 140,
                      border: '1px solid #000',
                      borderRadius: 8,
                      background: '#fff',
                      cursor: 'crosshair',
                      touchAction: 'none',
                    }}
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                    onTouchStart={start}
                    onTouchMove={move}
                    onTouchEnd={end}
                  />
                  <button
                    onClick={clear}
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      padding: '6px 10px',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    🗑️ 지우기
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ minWidth: 80, fontSize: 14 }}></span> {/* 정렬을 위한 빈 span */}
                <p style={{ fontSize: 12, color: '#555', flex: 1 }}>
                  ※ 마우스 또는 터치로 정자 서명해주세요.
                </p>
              </div>
            </div>

            {/* 주소 입력 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 :</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소를 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  flex: 1,
                }}
              />
            </label>

            {/* 연락처 입력 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span style={{ minWidth: 80, fontSize: 14, fontWeight: 'bold' }}>연&nbsp;&nbsp;락&nbsp;&nbsp;처 :</span>
              <input
                type="tel"
                value={contact}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setContact(formatted);
                  if (formatted.length > 0) {
                    setIsContactFocused(true);
                  }
                }}
                onFocus={() => {
                  if (!isContactFocused && contact === '010-0000-0000') {
                    setContact('');
                    setIsContactFocused(true);
                  }
                }}
                onBlur={() => {
                  if (contact.trim() === '' || contact === '010-0000-0000') {
                    setContact('010-0000-0000');
                    setIsContactFocused(false);
                  } else {
                    // 포맷이 완전하지 않으면 다시 포맷팅
                    const formatted = formatPhoneNumber(contact);
                    if (formatted.length < 13) {
                      setContact('010-0000-0000');
                      setIsContactFocused(false);
                    } else {
                      setContact(formatted);
                    }
                  }
                }}
                placeholder="010-0000-0000"
                maxLength={13}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  flex: 1,
                }}
              />
            </label>
          </div>

          </div>
          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => { if (isFormValid()) alert('동의서가 제출되었습니다.'); }}
              disabled={!isFormValid()}
              style={{
                width: '100%', maxWidth: 400, padding: '16px 32px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12,
                cursor: isFormValid() ? 'pointer' : 'not-allowed', background: isFormValid() ? '#1976d2' : '#ccc', color: isFormValid() ? '#fff' : '#999'
              }}
            >
              동의서 제출하기
            </button>
          </div>
        </section>
      </article>
    </main>
  );
}






