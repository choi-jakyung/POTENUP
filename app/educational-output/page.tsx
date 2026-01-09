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

// 연락처 포맷팅 함수
const sanitizeContactInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 11);

export default function EducationalOutputPage() {
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
  const [consent, setConsent] = useState<'agree' | 'disagree' | ''>('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');

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
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignaturePreviewUrl('');
  };

  const isFormValid = () => {
    const isContactValid = contact.length === 11;
    return (
      signatureDate !== '' &&
      course !== '' &&
      name.trim() !== '' &&
      address.trim() !== '' &&
      isContactValid &&
      hasSignature &&
      consent === 'agree'
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
      if (clearButton) {
        clearButton.style.display = 'none';
      }

      // 출력(PDF)용: 입력 폼 숨기고 요약 블록 표시
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          setSignaturePreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // ignore
      }
      article.setAttribute('data-output-mode', '1');
      await new Promise((r) => setTimeout(r, 200));

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

      if (clearButton) {
        clearButton.style.display = originalDisplay || '';
      }

      // 출력 모드 해제
      article.removeAttribute('data-output-mode');

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

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
          if (page > 0) {
            pdf.addPage();
          }
          
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
      const fileName = `${name}_교육산출물활용동의서_${date}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '120px 24px 48px 24px' }}>
      <article ref={articleRef} style={{ 
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
            <div style={{ width: 150, height: 48.42, position: 'relative' }}>
              <img
                src="/wanted-logo.png"
                alt="wanted logo"
                width={150}
                height={150}
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </div>
          </Link>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 72, marginBottom: 10, textAlign: 'center' }}>
          교육 산출물 활용 동의서
        </h1>

        <p style={{ margin: '9px 0', fontSize: 12, lineHeight: 1.8 }}>
          (주)원티드랩이 주관하는 포텐업 교육 과정 중 본인이 제작한 산출물(프로젝트 결과물, 발표자료, 포트폴리오 등)을 아래의 목적과 범위 내에서 활용하는 것에 동의합니다.
        </p>

        {/* 활용 목적 */}
        <section style={{ marginBottom: 30, padding: 24, background: '#f8f9fa', borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1976d2' }}>
            활용 목적
          </h2>
          <ul style={{ listStyle: 'disc', paddingLeft: 24, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>교육 과정 성과 공유 및 보고</li>
            <li style={{ marginBottom: 8 }}>프로그램 운영 홍보</li>
            <li>포텐업 훈련생들의 결과물 상호 공유</li>
          </ul>
        </section>

        {/* 활용 범위 */}
        <section style={{ marginBottom: 40, padding: 24, background: '#e3f2fd', borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1976d2' }}>
            활용 범위
          </h2>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#555' }}>
              형태:
            </h3>
            <p>이미지, 영상, 문서, 코드, 링크 등 산출물 원본 또는 편집본</p>
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#555' }}>
              매체:
            </h3>
            <p>(주)원티드랩 공식 홈페이지, SNS, 뉴스레터, 보도자료 등</p>
          </div>
        </section>

        {/* 동의 항목 */}
        <section style={{ marginBottom: 40, padding: 24, border: '2px solid #ddd', borderRadius: 12 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            <p style={{ margin: 0 }}>
              본인은 교육 중 제작한 산출물을 위와 같이 활용하는 것에 동의합니다.
            </p>
          </div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            <p style={{ margin: 0 }}>
              본인은 해당 산출물에 대한 활용 권한(저작권, 수정 및 배포 권한 등)이 (주)원티드랩에 귀속됨에 동의합니다.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '1.2em', lineHeight: 1, color: '#555' }}>▶</span>
            <p style={{ margin: 0 }}>
              본인은 산출물 활용 시 개인정보(이름, 소속 등)가 일부 포함될 수 있음에 동의합니다.
            </p>
          </div>
        </section>

        {/* 동의 확인 */}
        <section style={{ marginTop: 40, marginBottom: 40, padding: 24, border: '2px solid #1976d2', borderRadius: 12, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16 }}>
              <input 
                type="radio" 
                name="consent" 
                value="agree"
                checked={consent === 'agree'}
                onChange={(e) => setConsent(e.target.value as 'agree')}
                style={{ width: 20, height: 20, cursor: 'pointer' }} 
              />
              <span style={{ fontWeight: 600, color: '#1976d2' }}>동의함</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16 }}>
              <input 
                type="radio" 
                name="consent" 
                value="disagree"
                checked={consent === 'disagree'}
                onChange={(e) => setConsent(e.target.value as 'disagree')}
                style={{ width: 20, height: 20, cursor: 'pointer' }} 
              />
              <span style={{ fontWeight: 600, color: '#d32f2f' }}>동의하지 않음</span>
            </label>
          </div>
        </section>

        {/* 입력 폼 */}
        <section style={{ marginTop: 50 }}>
          <div style={{ marginTop: 40, border: '1px solid #eee', borderRadius: 8, padding: 24 }}>
            {(() => {
              const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32 };
              const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 'bold' };
              const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
              const dateStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', WebkitAppearance: 'none' as any };

              return (
                <>
                  {/* 출력/인쇄용 요약 블록 */}
                  <div data-summary-block style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '15%' }}>서명일</td>
                          <td style={{ padding: '4px 8px', width: '35%' }}>{signatureDate || '-'}</td>
                          <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '15%' }}>교육명</td>
                          <td style={{ padding: '4px 8px', width: '35%' }}>{course || '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>이름</td>
                          <td style={{ padding: '4px 8px', position: 'relative' }}>
                            <div style={{ display: 'inline-block', position: 'relative' }}>
                              {name.trim() || '-'}
                              {signaturePreviewUrl && (
                                <img
                                  src={signaturePreviewUrl}
                                  alt="서명"
                                  style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '100%', 
                                    transform: 'translate(-80%, -50%)',
                                    height: 40,
                                    opacity: 0.9,
                                    pointerEvents: 'none'
                                  }}
                                />
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>연락처</td>
                          <td style={{ padding: '4px 8px' }}>{contact || '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>주소</td>
                          <td colSpan={3} style={{ padding: '4px 8px' }}>{address.trim() || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 화면용 입력 폼 */}
                  <div data-form-block>
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
                            touchAction: 'none'
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
                            gap: 4
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
                  </div>
                </>
              );
            })()}
          </div>

          <div data-hide-in-print style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={generatePDF}
              disabled={!isFormValid() || isGeneratingPDF}
              style={{
                width: '100%',
                maxWidth: 400,
                padding: '16px 32px',
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                borderRadius: 12,
                cursor: isFormValid() && !isGeneratingPDF ? 'pointer' : 'not-allowed',
                background: isFormValid() && !isGeneratingPDF ? '#1976d2' : '#ccc',
                color: isFormValid() && !isGeneratingPDF ? '#fff' : '#999'
              }}
            >
              {isGeneratingPDF ? 'PDF 생성 중...' : '동의서 제출하기'}
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

            article [data-form-block] {
              display: none !important;
            }
            article [data-summary-block] {
              display: block !important;
            }
            article [data-hide-in-print] {
              display: none !important;
            }
          }

          /* 화면 기본: 요약 숨김 */
          article [data-summary-block] {
            display: none;
          }

          /* PDF 저장 시: 입력 폼 숨김 + 요약 표시 */
          article[data-output-mode='1'] [data-form-block] {
            display: none !important;
          }
          article[data-output-mode='1'] [data-summary-block] {
            display: block !important;
          }
          article[data-output-mode='1'] [data-hide-in-print] {
            display: none !important;
          }
          
          /* PDF 출력 시: 1페이지 필수 + 이미지 규격 유사하게 */
          article[data-output-mode='1'] {
            padding: 14px 32px !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            background: #fff !important;
          }
          
          article[data-output-mode='1'] h1 {
            font-size: 26px !important;
            font-weight: bold !important;
            color: #333 !important;
            margin-top: 0 !important;
            margin-bottom: 14px !important;
            text-align: center !important;
          }
          
          article[data-output-mode='1'] h2 {
            font-size: 16px !important;
            font-weight: bold !important;
            color: #1976d2 !important;
            margin-bottom: 12px !important;
          }
          
          article[data-output-mode='1'] h3 {
            font-size: 13px !important;
            font-weight: bold !important;
            color: #555 !important;
            margin-bottom: 6px !important;
          }
          
          article[data-output-mode='1'] p {
            margin: 7px 0 !important;
            line-height: 1.6 !important;
            font-size: 11px !important;
          }
          
          article[data-output-mode='1'] section {
            padding: 18px !important;
            border-radius: 12px !important;
          }
          
          /* 활용 목적 섹션 - 회색 배경 */
          article[data-output-mode='1'] section:nth-of-type(1) {
            margin-bottom: 20px !important;
            background: #f8f9fa !important;
          }
          
          /* 활용 범위 섹션 - 파란 배경 */
          article[data-output-mode='1'] section:nth-of-type(2) {
            margin-bottom: 22px !important;
            background: #e3f2fd !important;
          }
          
          /* 동의 항목 섹션 - 회색 테두리 */
          article[data-output-mode='1'] section:nth-of-type(3) {
            margin-bottom: 22px !important;
            border: 2px solid #ddd !important;
            background: #fff !important;
          }
          
          /* 동의 확인 섹션 - 파란 테두리 */
          article[data-output-mode='1'] section:nth-of-type(4) {
            margin-top: 22px !important;
            margin-bottom: 20px !important;
            border: 2px solid #1976d2 !important;
            background: #fff !important;
            padding: 18px !important;
          }
          
          article[data-output-mode='1'] ul {
            padding-left: 20px !important;
            margin: 0 !important;
            list-style: disc !important;
          }
          
          article[data-output-mode='1'] ul li {
            margin-bottom: 6px !important;
            font-size: 11px !important;
          }
          
          article[data-output-mode='1'] table {
            font-size: 11px !important;
            margin-top: 6px !important;
            margin-bottom: 6px !important;
            line-height: 1.5 !important;
          }
          
          article[data-output-mode='1'] table td {
            padding: 3px 6px !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(4) > div {
            display: flex !important;
            gap: 20px !important;
            justify-content: center !important;
            align-items: center !important;
          }
          
          article[data-output-mode='1'] label {
            font-size: 14px !important;
            gap: 6px !important;
            display: flex !important;
            align-items: center !important;
            cursor: pointer !important;
            line-height: 1 !important;
          }
          
          article[data-output-mode='1'] label span {
            font-weight: 600 !important;
            line-height: 18px !important;
          }
          
          /* 동의함 텍스트 - 파란색 */
          article[data-output-mode='1'] label:first-of-type span {
            color: #1976d2 !important;
          }
          
          /* 동의하지 않음 텍스트 - 빨간색 */
          article[data-output-mode='1'] label:last-of-type span {
            color: #d32f2f !important;
          }
          
          article[data-output-mode='1'] input[type="radio"] {
            width: 18px !important;
            height: 18px !important;
            cursor: pointer !important;
            margin: 0 !important;
            vertical-align: middle !important;
          }
          
          /* 화살표 아이콘 */
          article[data-output-mode='1'] section:nth-of-type(3) > div > span {
            color: #555 !important;
            font-size: 1.1em !important;
            line-height: 1 !important;
            margin-top: 2px !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(3) > div {
            margin-bottom: 12px !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(3) > div > p {
            margin: 0 !important;
            line-height: 1.6 !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(3) > div:last-child {
            margin-bottom: 0 !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(2) > div {
            margin-bottom: 12px !important;
          }
          
          article[data-output-mode='1'] section:nth-of-type(2) > div:last-child {
            margin-bottom: 0 !important;
          }

          /* PDF 출력 시 로고 크기 - 원본 사이즈 유지 (150x48.42) */
          article[data-output-mode='1'] > div:first-child {
            margin-bottom: 10px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div {
            width: 150px !important;
            height: 48.42px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div img {
            width: 150px !important;
            height: 48.42px !important;
            object-fit: contain !important;
          }
          
          article[data-output-mode='1'] footer {
            margin-top: 6px !important;
            padding-top: 3px !important;
            border-top: 1px solid #e0e0e0 !important;
            text-align: center !important;
          }
          
          article[data-output-mode='1'] footer p {
            font-size: 9px !important;
            color: #666 !important;
            margin: 0 !important;
          }
        `}</style>
      </article>
    </main>
  );
}

