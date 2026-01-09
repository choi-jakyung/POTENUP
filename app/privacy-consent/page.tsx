'use client';

import React,{ useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정'
];

const sanitizeContactInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 11);

export default function PrivacyConsentPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCourseOpen(false);
      }
    };

    if (isCourseOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCourseOpen]);

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

  const end = () => { 
    drawing.current = false;
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        setSignaturePreviewUrl(canvas.toDataURL('image/png'));
      }
    } catch {
      // ignore
    }
  };

  const clear = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setSignaturePreviewUrl('');
  setHasSignature(false);
};

  const isFormValid = () => {
    const isContactValid = contact.length === 11;
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
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '80px 24px 48px 24px' }}>
      <article style={{ 
        maxWidth: 794, 
        width: '100%',
        margin: '0 auto', 
        fontSize: 12, 
        lineHeight: 1.5,
        background: '#fff',
        padding: '16px 32px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: -60 }}>
          <Link href="/" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <div style={{ width: 150, height: 150, position: 'relative' }}>
              <Image src="/wanted-logo.png" alt="wanted logo" width={150} height={150} style={{ objectFit: 'contain' }} unoptimized />
            </div>
          </Link>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 0, marginBottom: 10, textAlign: 'center' }}>
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
            {(() => {
              const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32 };
              const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 'bold' };
              const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
              const dateStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', WebkitAppearance: 'none' as any };

              return (
                <>
                  {/* 서명일 / 교육명 */}
                  <div style={grid2}>
                    <div>
                      <label style={labelStyle}>서명일:</label>
                <input 
                  type="date" 
                        value={signatureDate}
                        onChange={(e) => setSignatureDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        onFocus={(e) => e.currentTarget.showPicker?.()}
                        style={dateStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>교육명:</label>
                      <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCourseOpen(!isCourseOpen);
                          }}
                      style={{
                            ...inputStyle,
                        background: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{course || '선택'}</span>
                          <span style={{ transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                        {isCourseOpen && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            background: '#fff',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                          }}>
                            {courses.map((courseOption, index) => (
                              <div
                                key={courseOption}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCourse(courseOption);
                                  setIsCourseOpen(false);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: index < courses.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  backgroundColor: course === courseOption ? '#e3f2fd' : '#fff',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => { if (course !== courseOption) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                                onMouseLeave={(e) => { if (course !== courseOption) e.currentTarget.style.backgroundColor = '#fff'; }}
                              >
                                {courseOption}
                              </div>
                            ))}
                          </div>
                        )}
                  </div>
              </div>
            </div>

                  {/* 성명 / 정자서명란 */}
                  <div style={{ ...grid2, marginTop: 20, alignItems: 'start' }}>
                    <div>
                      <label style={labelStyle}>성명:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="성명을 입력하세요"
                        style={inputStyle}
              />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 'bold' }}>정자서명란 :</span>
                        <span style={{ fontSize: 12 }}>(인)</span>
              </div>
                      <div style={{ position: 'relative', width: '100%' }}>
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
                      <p style={{ fontSize: 12, color: '#555', marginTop: 8, marginBottom: 0 }}>
                  ※ 마우스 또는 터치로 정자 서명해주세요.
                </p>
              </div>
            </div>

                  {/* 주소 / 연락처 */}
                  <div style={{ ...grid2, marginTop: 20 }}>
                    <div>
                      <label style={labelStyle}>주소:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소를 입력하세요"
                        style={inputStyle}
              />
                    </div>
                    <div>
                      <label style={labelStyle}>연락처:</label>
              <input
                type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                value={contact}
                        onChange={(e) => setContact(sanitizeContactInput(e.target.value))}
                        placeholder="01012345678"
                        maxLength={11}
                        style={inputStyle}
              />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div data-hide-in-print style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
          </div>

          <div data-hide-in-print style={{ marginTop: 32, textAlign: 'center' }}>
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

        <footer style={{ marginTop: 8, marginBottom: 0, paddingTop: 4, paddingBottom: 0, borderTop: '1px solid rgb(224, 224, 224)', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'rgb(102, 102, 102)', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>

        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            main {
              padding: 0 !important;
              background: #fff !important;
              min-height: auto !important;
            }

            article {
              padding: 8mm 8mm !important;
              box-shadow: none !important;
              line-height: 2.25 !important;
              font-size: 10px !important;
            }

            article p {
              margin: 6px 0 !important;
              line-height: 1.8 !important;
            }
            
            article [data-hide-in-print] {
              display: none !important;
            }
          }
        `}</style>
      </article>
    </main>
  );
}






