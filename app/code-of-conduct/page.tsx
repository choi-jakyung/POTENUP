'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정',
];

export default function CodeOfConductPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  
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

  const sanitizeContactInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 11);


  /* ===== 서명 패드 세팅 ===== */
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
        const url = canvas.toDataURL('image/png');
        setSignaturePreviewUrl(url);
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
      
      // 드롭다운 닫기
      setIsCourseOpen(false);
      await new Promise(r => setTimeout(r, 50));

      const article = articleRef.current;
      if (!article) return;

      // PDF/프린트에 불필요한 UI 숨김
      const hideTargets = Array.from(article.querySelectorAll<HTMLElement>('[data-hide-in-print]'));
      const originalDisplays = hideTargets.map((el) => el.style.display);
      hideTargets.forEach((el) => {
        el.style.display = 'none';
      });

      // 지우기 버튼 숨김
      const clearButton = clearButtonRef.current;
      const originalDisplay = clearButton?.style.display || '';
      if (clearButton) clearButton.style.display = 'none';

      // PDF 출력 모드 활성화
      article.setAttribute('data-output-mode', '1');

      // PDF 생성을 위한 대기 (레이아웃 안정화)
      await new Promise(r => setTimeout(r, 300));

      const a4WidthPx = 794; // 210mm @ 96dpi
      const canvas = await html2canvas(article, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 3,
        width: a4WidthPx,
        windowWidth: a4WidthPx,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      } as any);

      // 숨김 복원
      hideTargets.forEach((el, idx) => {
        el.style.display = originalDisplays[idx] || '';
      });
      if (clearButton) clearButton.style.display = originalDisplay || '';
      
      // PDF 출력 모드 해제
      article.removeAttribute('data-output-mode');

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgAspectRatio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / imgAspectRatio;

      if (imgHeight > pdfHeight) {
        // 여러 페이지로 분할
        const totalPages = Math.ceil(imgHeight / pdfHeight);
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
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
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
        fontSize: 9, 
        lineHeight: 1.4,
        background: '#fff',
        padding: '12px 24px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: -30 }}>
          <Link href="/" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <div style={{ width: 80, height: 80, position: 'relative' }}>
          <Image
            src="/wanted-logo.png"
            alt="wanted logo"
                width={80}
                height={80}
            style={{ objectFit: 'contain' }}
            unoptimized
          />
            </div>
          </Link>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 0, marginBottom: 8, textAlign: 'center' }}>
          행동 강령 서약서
        </h1>

        <p>
          본인은 (주)원티드랩이 주관하는 포텐업 교육 과정의 훈련생으로서, 교육에 참여하는 기간 동안 다음의 사항을 준수할 것을 서약합니다.
        </p>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid #999',
            borderRadius: 8,
            background: '#fafafa',
          }}
        >
          <div style={{ marginTop: 8 }}>
            <p style={{ margin: '4px 0' }}>1. 타인과 불필요한 신체 접촉을 하지 않도록 주의하겠습니다.</p>
            <p style={{ margin: '4px 0' }}>2. 대화에 욕설, 비속어, 은어(상대방이 수치심을 느낄 수 있는 언어)를 사용하지 않고 상대방을 존중하는 언어를 사용하겠습니다.</p>
            <p style={{ margin: '4px 0' }}>3. 화를 내거나 과격한 몸짓, 언성을 높이는 행위 등으로 상대방을 위협하거나 어떠한 폭력도 행사하지 않겠습니다.</p>
            <p style={{ margin: '4px 0' }}>4. 성별, 정치적 성향, 국적, 인종, 지역, 종교, 나이, 사회적 신분, 학력, 외모, 성적 지향 장애, 질병 등 나와 다름에 있어서 차별하거나 강요하지 않겠습니다.</p>
            <p style={{ margin: '4px 0' }}>5. (주)원티드랩에서 훈련 과정을 운영하기 위해 정한 규정을 지키며 교육 과정에 성실히 참여하겠습니다.</p>
            <p style={{ margin: '4px 0' }}>6. 위에 언급된 사항 외에도 포텐업 행동 강령을 지키고 모두를 포용할 수 있는 학습 환경을 만들기 위해 노력하겠습니다.</p>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 10, background: '#E3F2FD', borderRadius: 8, textAlign: 'center', fontWeight: 600, fontSize: 11 }}>
          이를 위반하여 3회 이상의 경고를 받은 경우, 국민내일배움카드 운영 규정에 따라 제적 절차가 진행될 수 있음을 동의합니다.
        </div>

        {/* PDF 출력용 요약 블록 */}
        <section data-summary-block style={{ marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 'bold', width: '15%' }}>서명일</td>
                <td style={{ padding: '3px 6px', width: '35%' }}>{signatureDate || '-'}</td>
                <td style={{ padding: '3px 6px', fontWeight: 'bold', width: '15%' }}>교육명</td>
                <td style={{ padding: '3px 6px', width: '35%' }}>{course || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>이름</td>
                <td style={{ padding: '3px 6px', position: 'relative' }}>
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
                          height: 30,
                          opacity: 0.9,
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </div>
                </td>
                <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>연락처</td>
                <td style={{ padding: '3px 6px' }}>{contact || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>주소</td>
                <td colSpan={3} style={{ padding: '3px 6px' }}>{address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section data-form-block style={{ marginTop: 16 }}>
          {/* 입력 영역 */}
          <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
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
                          overflow: 'hidden',
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
                                  transition: 'background-color 0.2s',
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

          <div data-hide-in-print style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
          </div>

          <div data-hide-in-print style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={generatePDF}
              disabled={!isFormValid() || isGeneratingPDF}
              style={{
                width: '100%', maxWidth: 400, padding: '16px 32px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12,
                cursor: isFormValid() && !isGeneratingPDF ? 'pointer' : 'not-allowed', 
                background: isFormValid() && !isGeneratingPDF ? '#1976d2' : '#ccc', 
                color: isFormValid() && !isGeneratingPDF ? '#fff' : '#999'
              }}
            >
              {isGeneratingPDF ? 'PDF 생성 중...' : '서약서 제출하기'}
            </button>
          </div>
        </section>

        <footer style={{ marginTop: 6, marginBottom: 0, paddingTop: 3, paddingBottom: 0, borderTop: '1px solid rgb(224, 224, 224)', textAlign: 'center' }}>
          <p style={{ fontSize: 8, color: 'rgb(102, 102, 102)', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>

        <style jsx global>{`
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
          
          /* PDF 출력 시: 첨부 PDF와 동일한 규격 */
          article[data-output-mode='1'] {
            padding: 16px 28px !important;
            font-size: 10px !important;
            line-height: 1.6 !important;
          }
          
          article[data-output-mode='1'] h1 {
            font-size: 22px !important;
            font-weight: bold !important;
            margin-top: 0 !important;
            margin-bottom: 12px !important;
            text-align: center !important;
          }
          
          article[data-output-mode='1'] p {
            margin: 5px 0 !important;
            line-height: 1.6 !important;
            font-size: 10px !important;
          }
          
          article[data-output-mode='1'] div {
            margin-top: 8px !important;
            margin-bottom: 8px !important;
          }
          
          article[data-output-mode='1'] section {
            margin-top: 10px !important;
            margin-bottom: 10px !important;
            padding: 0 !important;
          }
          
          /* 회색 박스 스타일 */
          article[data-output-mode='1'] > div:nth-of-type(3) {
            padding: 14px !important;
            border: 1px solid #999 !important;
            border-radius: 8px !important;
            background: #fafafa !important;
            margin-top: 16px !important;
            margin-bottom: 16px !important;
          }
          
          /* 파란 박스 스타일 */
          article[data-output-mode='1'] > div:nth-of-type(4) {
            padding: 12px !important;
            background: #e3f2fd !important;
            border-radius: 8px !important;
            text-align: center !important;
            font-weight: 600 !important;
            margin-top: 16px !important;
            margin-bottom: 16px !important;
          }
          
          article[data-output-mode='1'] table {
            font-size: 10px !important;
            margin-top: 10px !important;
            line-height: 1.5 !important;
            border-collapse: collapse !important;
          }
          
          article[data-output-mode='1'] table td {
            padding: 4px 8px !important;
            border: 1px solid #ddd !important;
          }

          /* PDF 출력 시 로고 크기 */
          article[data-output-mode='1'] > div:first-child {
            margin-bottom: -40px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div {
            width: 90px !important;
            height: 90px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div img {
            width: 90px !important;
            height: 90px !important;
            object-fit: contain !important;
          }
          
          article[data-output-mode='1'] footer {
            margin-top: 10px !important;
            padding-top: 6px !important;
            border-top: 1px solid #e0e0e0 !important;
          }
          
          article[data-output-mode='1'] footer p {
            font-size: 9px !important;
            color: #666 !important;
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
        `}</style>
      </article>
    </main>
  );
}

