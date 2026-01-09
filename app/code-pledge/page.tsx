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

export default function CodePledgePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  const [pledgeDate, setPledgeDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
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
      pledgeDate !== '' &&
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
      const signCanvas = canvasRef.current;
      if (!article || !signCanvas) return;
      
      // 서명 이미지 저장
      const signatureDataUrl = signCanvas.toDataURL('image/png');
      setSignaturePreviewUrl(signatureDataUrl);
      
      const clearButton = clearButtonRef.current;
      const originalDisplay = clearButton?.style.display || '';
      if (clearButton) clearButton.style.display = 'none';
      
      article.setAttribute('data-output-mode', '1');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // A4 용지 크기에 맞춰 캔버스 생성 (210mm = 794px at 96 DPI)
      const a4WidthPx = 794;
      const a4HeightPx = 1123; // 297mm at 96 DPI
      
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
      
      article.removeAttribute('data-output-mode');
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
        // 여러 페이지로 분할
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
        // 단일 페이지
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      }
      
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${name}_행동강령서약서_${date}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '80px 24px 48px 24px' }}>
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
              <Image src="/wanted-logo.png" alt="wanted logo" width={150} height={48.42} style={{ objectFit: 'contain' }} unoptimized />
            </div>
          </Link>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 0, marginBottom: 10, textAlign: 'center' }}>
          행동 강령 서약서
        </h1>

        <p style={{ marginBottom: 30, textAlign: 'center', fontSize: 15, lineHeight: 1.8 }}>
          본인은 (주)원티드랩이 주관하는 포텐업 교육 과정의 훈련생으로서, 교육에 참여하는 기간 동안 다음의 사항을 준수할 것을 서약합니다.
        </p>

        <div style={{
          marginTop: 60,
          padding: 24,
          border: '1px solid #999',
          borderRadius: 12,
          background: '#fafafa'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 24, paddingLeft: 0 }}>
              1. 타인과 불필요한 신체 접촉을 하지 않도록 주의하겠습니다.
            </li>
            <li style={{ marginBottom: 24, paddingLeft: 0 }}>
              2. 대화에 욕설, 비속어, 은어(상대방이 수치심을 느낄 수 있는 언어)를 사용하지 않고 상대방을 존중하는 언어를 사용하겠습니다.
            </li>
            <li style={{ marginBottom: 24, paddingLeft: 0 }}>
              3. 화를 내거나 과격한 몸짓, 언성을 높이는 행위 등으로 상대방을 위협하거나 어떠한 폭력도 행사하지 않겠습니다.
            </li>
            <li style={{ marginBottom: 24, paddingLeft: 0 }}>
              4. 성별, 정치적 성향, 국적, 인종, 지역, 종교, 나이, 사회적 신분, 학력, 외모, 성적 지향 장애, 질병 등 나와 다름에 있어서 차별하거나 강요하지 않겠습니다.
            </li>
            <li style={{ marginBottom: 24, paddingLeft: 0 }}>
              5. ㈜원티드랩에서 훈련 과정을 운영하기 위해 정한 규정을 지키며 교육 과정에 성실히 참여하겠습니다.
            </li>
            <li style={{ marginBottom: 0, paddingLeft: 0 }}>
              6. 위에 언급된 사항 외에도 포텐업 행동 강령을 지키고 모두를 포용할 수 있는 학습 환경을 만들기 위해 노력하겠습니다.
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 36, padding: 18, background: '#E3F2FD', borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>
          이를 위반하여 3회 이상의 경고를 받은 경우, 국민내일배움카드 운영 규정에 따라 제적 절차가 진행될 수 있음을 동의합니다.
        </div>

        <section style={{ marginTop: 50 }}>
          {/* PDF 출력용 요약 블록 (표 형태) */}
          <div data-summary-block style={{ marginTop: 40, padding: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '15%' }}>서약일</td>
                  <td style={{ padding: '6px 8px', width: '35%' }}>{pledgeDate}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '15%' }}>교육명</td>
                  <td style={{ padding: '6px 8px', width: '35%' }}>{course || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>성명</td>
                  <td style={{ padding: '6px 8px', position: 'relative' }}>
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
                            height: 25,
                            opacity: 0.9,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>주소</td>
                  <td style={{ padding: '6px 8px' }}>{address.trim() || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>연락처</td>
                  <td colSpan={3} style={{ padding: '6px 8px' }}>{contact || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div data-form-block style={{ marginTop: 40, border: '1px solid #eee', borderRadius: 8, padding: 24 }}>
            {(() => {
              const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32 };
              const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontWeight: 'bold' };
              const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
              const dateStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', WebkitAppearance: 'none' as any };

              return (
                <>
                  {/* 서약일 / 교육명 */}
                  <div style={grid2}>
                    <div>
                      <label style={labelStyle}>서약일:</label>
                      <input
                        type="date"
                        value={pledgeDate}
                        onChange={(e) => setPledgeDate(e.target.value)}
                        onClick={(e) => {
                          const target = e.currentTarget as any;
                          target.showPicker?.();
                        }}
                        onFocus={(e) => {
                          const target = e.currentTarget as any;
                          target.showPicker?.();
                        }}
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
                </>
              );
            })()}
          </div>

          <div data-hide-in-print style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
                style={{ width: 18, height: 18, cursor: 'pointer' }} 
              />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
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
              {isGeneratingPDF ? 'PDF 생성 중...' : '서약서 제출하기'}
            </button>
          </div>
        </section>

        <footer style={{ marginTop: 8, marginBottom: 0, paddingTop: 4, paddingBottom: 0, borderTop: '1px solid rgb(224, 224, 224)', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'rgb(102, 102, 102)', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>

        <style jsx global>{`
          /* 화면 기본: 요약 블록 숨김 */
          article [data-summary-block] {
            display: none !important;
          }

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
          
          /* PDF 출력 시: 입력 폼 숨김 + 요약 표시 + 1페이지 압축 */
          article[data-output-mode='1'] [data-form-block] {
            display: none !important;
          }
          
          article[data-output-mode='1'] [data-summary-block] {
            display: block !important;
          }
          
          article[data-output-mode='1'] [data-hide-in-print] {
            display: none !important;
          }
          
          article[data-output-mode='1'] {
            padding: 10px 32px !important;
            font-size: 15px !important;
            line-height: 1.6 !important;
          }
          
          article[data-output-mode='1'] > div:first-child {
            margin-bottom: -50px !important;
          }
          
          article[data-output-mode='1'] > div:first-child > a > div {
            width: 110px !important;
            height: 110px !important;
          }
          
          article[data-output-mode='1'] h1 {
            font-size: 30px !important;
            margin-bottom: 10px !important;
          }
          
          article[data-output-mode='1'] > p {
            font-size: 15px !important;
            line-height: 1.6 !important;
            margin-bottom: 18px !important;
          }
          
          article[data-output-mode='1'] > div:nth-of-type(2) {
            margin-top: 18px !important;
            padding: 14px 24px !important;
          }
          
          article[data-output-mode='1'] > div:nth-of-type(2) ul li {
            font-size: 15px !important;
            line-height: 1.6 !important;
            margin-bottom: 8px !important;
          }
          
          article[data-output-mode='1'] > div:nth-of-type(2) ul li:last-child {
            margin-bottom: 0 !important;
          }
          
          article[data-output-mode='1'] > div:nth-of-type(3) {
            margin-top: 18px !important;
            padding: 12px 18px !important;
            font-size: 15px !important;
          }
          
          article[data-output-mode='1'] section {
            margin-top: 20px !important;
          }
          
          article[data-output-mode='1'] section [data-summary-block] {
            margin-top: 20px !important;
            padding: 12px 16px !important;
            font-size: 15px !important;
          }
          
          article[data-output-mode='1'] section [data-summary-block] table {
            font-size: 15px !important;
          }
          
          article[data-output-mode='1'] footer {
            margin-top: 6px !important;
            padding-top: 3px !important;
          }
          
          article[data-output-mode='1'] footer p {
            font-size: 15px !important;
          }
        `}</style>
      </article>
    </main>
  );
}

