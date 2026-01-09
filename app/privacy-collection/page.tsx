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

export default function PrivacyCollectionPage() {
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
      pdf.save(`${name}_개인정보수집이용제공동의서_${date}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '120px 24px 48px 24px' }}>
      <article
        ref={articleRef}
        style={{
          maxWidth: 794,
          width: '100%',
          margin: '0 auto',
          fontSize: 12,
          lineHeight: 1.5,
          background: '#fff',
          padding: '16px 32px',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
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

        <h1 style={{ fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 72, marginBottom: 16, textAlign: 'center' }}>
          개인정보 수집ㆍ이용ㆍ제공 동의서
        </h1>

        {/* 개인정보의 수집·이용에 관한 사항 */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1976d2' }}>
            ◎ 개인정보의 수집·이용에 관한 사항
          </h2>
          <p style={{ marginBottom: 20 }}>
            (주)원티드랩에서는 「포텐업 교육과정」 운영을 위하여 아래와 같이 개인정보를 수집 및 이용하고자 합니다. 이용자가 제공한 모든 정보는 「개인정보보호법」등 관련 법규에 의거하여 목적에 필요한 용도 이외로는 사용되지 않습니다.
          </p>
        </section>

        {/* 기본 개인정보 수집 및 활용 */}
        <section style={{ marginBottom: 40, padding: 24, background: '#f8f9fa', borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#333' }}>
            ◎ 기본 개인정보 수집 및 활용
          </h3>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 12, color: '#555' }}>
              1. 개인정보 수집 항목
            </h4>
            <p>
              참여자의 성명, 연락처, 생년월일, 이메일, 거주지, 학력, 경력사항(근무이력, 수상이력, 외국어, 개인 링크 등), 건강보험자격
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 12, color: '#555' }}>
              2. 개인정보 수집 및 이용목적
            </h4>
            <p style={{ marginBottom: 12 }}>
              (주)원티드랩은 지원자의 개인정보를 다음의 목적을 위해서만 활용하며 수집된 정보는 아래 명시된 내용 이외의 목적으로 이용하지 않습니다.
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: 24, margin: 0 }}>
              <li>모집 접수, 심사, 선정, 지원, 추천, 취업관리 등</li>
              <li>포텐업 교육과정 운영과 관련된 부분</li>
              <li>대외홍보</li>
            </ul>
          </div>
        </section>

        {/* 개인정보의 제3자 제공 */}
        <section style={{ marginBottom: 40, padding: 24, background: '#e3f2fd', borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#1976d2' }}>
            ◎ 개인정보의 제3자 제공
          </h3>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#555' }}>
              1. 제공받는자
            </h4>
            <p>원티드랩 취업 협력 기관 및 채용 협력 기업</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#555' }}>
              2. 제공받는 자의 이용목적
            </h4>
            <p>수집 및 이용에 동의한 정보 중 위탁업무 목적달성을 위해 필요한 정보에 한함</p>
          </div>

          <div>
            <h4 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#555' }}>
              3. 제공할 개인정보의 항목
            </h4>
            <p>수집된 개인정보</p>
          </div>
        </section>

        {/* 개인정보의 수집, 활용 및 제3자 제공에 따른 이용기간 */}
        <section style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
            ◎ 개인정보의 수집, 활용 및 제3자 제공에 따른 이용기간
          </h3>
          <p style={{ marginBottom: 20 }}>
            개인정보는 위 수집, 활용 및 제 3자 제공에 따른 이용목적을 위하여 정보가 제공된 날로부터 동의 철회 시(최대 3년)까지 보유되며, 제공된 개인정보 이용을 거부하고자 할 경우 개인정보 관리책임자를 통해 열람, 정정, 삭제를 요구할 수 있습니다.
          </p>
          <p style={{ fontWeight: 600, color: '#d32f2f' }}>
            귀하는 위 사항에 대해 개인정보 수집 및 활용, 제3자 제공에 관하여 동의를 거부할 권리가 있으며, 동의를 거부할 경우에는 프로그램 참여 제한 또는 불이익이 있음을 알려드립니다.
          </p>
        </section>

        {/* 동의 확인 */}
        <section data-hide-in-print style={{ marginTop: 40, marginBottom: 40, padding: 24, border: '2px solid #1976d2', borderRadius: 12, background: '#fff' }}>
          <p style={{ marginBottom: 20, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
            「개인정보보호법」 등 관련 법규에 따라 본인은 위와 같이 개인정보 수집 및 활용, 제3자에게 개인정보 제공에 동의함
          </p>

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

        {/* PDF 출력용 요약 블록 */}
        <section data-summary-block style={{ marginTop: 30 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
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
                <td colSpan={3} style={{ padding: '4px 8px' }}>{address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 입력 폼 */}
        <section data-form-block style={{ marginTop: 50 }}>
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

          /* PDF 저장 시: 1페이지 압축 + 폰트 통일 */
          article[data-output-mode='1'] {
            padding: 8px 32px !important;
            font-size: 15px !important;
            line-height: 1.4 !important;
          }

          article[data-output-mode='1'] h1 {
            font-size: 30px !important;
            margin-top: 0 !important;
            margin-bottom: 6px !important;
          }

          article[data-output-mode='1'] h2 {
            font-size: 15px !important;
            margin-top: 8px !important;
            margin-bottom: 4px !important;
          }

          article[data-output-mode='1'] h3 {
            font-size: 15px !important;
            margin-top: 5px !important;
            margin-bottom: 3px !important;
          }

          article[data-output-mode='1'] h4 {
            font-size: 15px !important;
            margin-top: 4px !important;
            margin-bottom: 3px !important;
          }

          article[data-output-mode='1'] p {
            margin: 3px 0 !important;
            line-height: 1.4 !important;
            font-size: 15px !important;
          }

          article[data-output-mode='1'] section {
            margin-top: 8px !important;
            margin-bottom: 8px !important;
            padding: 8px !important;
          }

          article[data-output-mode='1'] ul {
            margin: 3px 0 !important;
            padding-left: 18px !important;
          }

          article[data-output-mode='1'] li {
            margin: 2px 0 !important;
            font-size: 15px !important;
            line-height: 1.4 !important;
          }

          /* PDF 출력 시 로고 크기 고정 */
          article[data-output-mode='1'] > div:first-child {
            margin-bottom: 0px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div {
            width: 120px !important;
            height: 38.74px !important;
          }

          article[data-output-mode='1'] > div:first-child > a > div img {
            width: 120px !important;
            height: 38.74px !important;
            object-fit: contain !important;
          }

          article[data-output-mode='1'] h1 {
            margin-top: 30px !important;
          }

          article[data-output-mode='1'] footer {
            margin-top: 4px !important;
            padding-top: 2px !important;
          }

          article[data-output-mode='1'] footer p {
            font-size: 15px !important;
          }

          article[data-output-mode='1'] input,
          article[data-output-mode='1'] button,
          article[data-output-mode='1'] label {
            font-size: 15px !important;
          }

          article[data-output-mode='1'] table {
            font-size: 15px !important;
          }

          article[data-output-mode='1'] table td {
            padding: 4px 6px !important;
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
              padding: 5mm 8mm !important;
              box-shadow: none !important;
              font-size: 8px !important;
              line-height: 1.3 !important;
            }

            article [data-hide-in-print] {
              display: none !important;
            }
          }

          /* 모바일 반응형 스타일 */
          @media (max-width: 768px) {
            main {
              padding: 24px 16px !important;
            }
            
            article {
              padding: 16px 20px !important;
            }
            
            article h1 {
              font-size: 24px !important;
              margin-top: 48px !important;
            }
            
            article h2 {
              font-size: 18px !important;
            }
            
            article h3 {
              font-size: 16px !important;
            }
            
            article p {
              font-size: 14px !important;
            }
            
            article section {
              padding: 16px !important;
            }
            
            article ul li {
              font-size: 14px !important;
            }
            
            article div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            
            article input,
            article button,
            article select {
              font-size: 16px !important;
            }
            
            article canvas {
              height: 120px !important;
            }
          }
        `}</style>
      </article>
    </main>
  );
}

