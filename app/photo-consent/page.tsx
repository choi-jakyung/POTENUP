'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정'
];

const sanitizeContactInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 11);

export default function PhotoConsentPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
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

  const end = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  const generatePDF = async () => {
    if (!isFormValid() || isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      const article = articleRef.current;
      if (!article) return;
      const clearButton = clearButtonRef.current;
      const originalDisplay = clearButton?.style.display || '';
      if (clearButton) clearButton.style.display = 'none';
      // A4 용지 크기에 맞춰 캔버스 생성 (210mm = 794px at 96 DPI)
      const a4WidthPx = 794;
      
      const canvas = await html2canvas(article, {
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff', 
        scale: 3, // 고해상도를 위해 scale 증가
        width: a4WidthPx,
        windowWidth: a4WidthPx,
        allowTaint: true, 
        scrollX: 0, 
        scrollY: 0,
      } as any);
      if (clearButton) clearButton.style.display = originalDisplay || '';
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // A4 용지 크기 (mm)
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 0; // 여백 없이 전체 페이지 사용
      
      const imgAspectRatio = canvas.width / canvas.height;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeightPerPage = pdfHeight - (margin * 2);
      const imgWidth = availableWidth;
      const imgHeight = availableWidth / imgAspectRatio;
      
      if (imgHeight > availableHeightPerPage) {
        const totalPages = Math.ceil(imgHeight / availableHeightPerPage);
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const sourceY = (canvas.height / totalPages) * page;
          const sourceHeight = canvas.height / totalPages;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width; 
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, availableHeightPerPage, undefined, 'FAST');
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      }
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${name}_사진촬영초상권활용동의서_${date}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article ref={articleRef} style={{ 
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
                          ref={clearButtonRef}
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

          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={generatePDF}
              disabled={!isFormValid() || isGeneratingPDF}
              style={{
                width: '100%', maxWidth: 400, padding: '16px 32px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12,
                cursor: isFormValid() && !isGeneratingPDF ? 'pointer' : 'not-allowed', background: isFormValid() && !isGeneratingPDF ? '#1976d2' : '#ccc', color: isFormValid() && !isGeneratingPDF ? '#fff' : '#999'
              }}
            >
              {isGeneratingPDF ? 'PDF 생성 중...' : '동의서 제출하기'}
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






