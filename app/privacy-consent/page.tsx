'use client';

import React,{ useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정'
];

// 연락처 포맷팅 함수 (010-0000-0000 형식)
const formatPhoneNumber = (value: string) => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
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

export default function PrivacyConsentPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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

  const clear = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setHasSignature(false);
};

  const isFormValid = () => {
    const isContactValid = contact.replace(/[^\d]/g, '').length === 11;
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
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article style={{ 
        maxWidth: 794, 
        width: '100%',
        margin: '0 auto', 
        fontSize: 14, 
        lineHeight: 1.9,
        background: '#fff',
        padding: '40px 60px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <Image src="/wanted-logo.png" alt="wanted logo" width={96} height={96} style={{ objectFit: 'contain' }} unoptimized />
          </Link>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' }}>
          개인정보 수집 · 이용 · 제공 동의서
        </h1>

        {/* 개인정보 수집·이용에 관한 사항 */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
            개인정보의 수집 · 이용에 관한 사항
          </h2>
          <p>
            (주)원티드랩에서는「포텐업 교육과정」운영을 위하여 아래와 같이 개인정보를 수집 및 이용하고자 합니다. 이용자가
            제공하는 모든 정보는「개인정보보호법」등 관련 법규에 의거하여 필요한 한도 내에서만 활용되며 사용되지 않습니다.
          </p>

          <div style={{ marginTop: 20, borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
                1. 개인정보 수집 항목
              </div>
              <div style={{ padding: '10px 14px', flex: 1 }}>
                참여자 성명, 연락처, 생년월일, 이메일, 거주지, 학력, 경력사항(근무이력, 외국어, 외국인 링크 등), 건강보험자격
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
                2. 개인정보 수집 및 이용목적
              </div>
              <div style={{ padding: '10px 14px', flex: 1 }}>
                (주)원티드랩은 지원자의 개인정보를 다음의 목적을 위해서만 활용하며 수집된 정보는 아래 명시된 내용 이외의 목적으로 사용하지 않습니다.
                <ol style={{ listStyleType: 'decimal', paddingLeft: 20, margin: '8px 0' }}>
                  <li>모집 접수, 심사, 선정, 지원, 추천, 취업관리 등</li>
                  <li>포텐업 교육과정 운영 및 관련된 부분</li>
                  <li>대외 홍보</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보의 제3자 제공 */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
            개인정보의 제3자 제공
          </h2>
          <div style={{ marginTop: 20, borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
                1. 제공받는 곳
              </div>
              <div style={{ padding: '10px 14px', flex: 1 }}>
                원티드랩 취업 협력 기관 및 채용 기업
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
                2. 제공받는 자의 이용목적
              </div>
              <div style={{ padding: '10px 14px', flex: 1 }}>
                수집 및 이용에 동의한 정보 중 위탁 업무 목적 달성에 필요한 정보에 한함
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '10px 14px', minWidth: 150, background: '#f8f8f8', fontWeight: 'bold', borderRight: '1px solid #eee' }}>
                3. 제공할 개인정보의 항목
              </div>
              <div style={{ padding: '10px 14px', flex: 1 }}>
                수집된 개인정보
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보의 수집, 활용 및 제3자 제공에 따른 이용 기간 */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>
            개인정보의 수집, 활용 및 제3자 제공에 따른 이용 기간
          </h2>
          <p>
            개인정보는 위 수집, 활용 및 제 3자 제공에 따른 이용 목적을 위하여 정보가 제공된 날로부터 정보가
            제공된 날로부터 동의 철회 시 (최대 3년)까지 보유되며, 제공된 정보 이용을 철회하고
            삭제를 요청할 수 있습니다.
          </p>
        </div>

        <p>
          귀하는 위 사항에 대해 개인정보 수집 및 활용, 제3자 제공에 관하여 동의를 거부할 권리가 있으며, 동의를 거부할 경우
          프로그램 참여에 제한이 있을 수 있음을 알려드립니다.
        </p>

        <p style={{ marginTop: 20 }}>
          「개인정보보호법」등 관련 법규에 따라 본인은 위와 같이 개인정보 수집 및 활용, 제3자에게 개인정보 제공에 동의합니다.
        </p>        
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
                inputMode="tel"
                value={contact}
                onChange={(e) => setContact(formatPhoneNumber(e.target.value))}
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

        <footer style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgb(224, 224, 224)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgb(102, 102, 102)', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>
      </article>
    </main>
  );
}






