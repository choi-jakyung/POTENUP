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
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/[^\d]/g, '');
  const limitedNumbers = numbers.slice(0, 11);
  
  if (limitedNumbers.length <= 3) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
  } else {
    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
  }
};

export default function EducationalOutputPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('010-0000-0000');
  const [consent, setConsent] = useState<'agree' | 'disagree' | ''>('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isContactFocused, setIsContactFocused] = useState(false);
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
          교육 산출물 활용 동의서
        </h1>

        <p style={{ marginBottom: 30, fontSize: 15, lineHeight: 1.8 }}>
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
            {/* 서명일 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>서&nbsp;&nbsp;명&nbsp;&nbsp;일 :</span>
              <input 
                type="date" 
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                style={{ 
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  flex: 1,
                  maxWidth: 200
                }} 
              />
            </label>

            {/* 교육명 */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>교&nbsp;&nbsp;육&nbsp;&nbsp;명 :</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setIsCourseOpen(!isCourseOpen)}
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
                      fontSize: 14
                    }}
                  >
                    <span>{course || '선택'}</span>
                    <span style={{ transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▲
                    </span>
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
                        <label
                          key={courseOption}
                          onClick={() => {
                            setCourse(courseOption);
                            setIsCourseOpen(false);
                          }}
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < courses.length - 1 ? '1px solid #f0f0f0' : 'none',
                            backgroundColor: course === courseOption ? '#e3f2fd' : '#fff'
                          }}
                          onMouseEnter={(e) => {
                            if (course !== courseOption) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (course !== courseOption) {
                              e.currentTarget.style.backgroundColor = '#fff';
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="course"
                            checked={course === courseOption}
                            onChange={() => {
                              setCourse(courseOption);
                              setIsCourseOpen(false);
                            }}
                            style={{ marginRight: 8 }}
                          />
                          {courseOption}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* 성명 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 :</span>
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
                  flex: 1
                }}
              />
              <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>(인)</span>
            </label>

            {/* 정자서명란 */}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ minWidth: 120, fontSize: 14 }}></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ minWidth: 120, fontSize: 14 }}></span>
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ minWidth: 120, fontSize: 14 }}></span>
                <p style={{ fontSize: 12, color: '#555', flex: 1 }}>
                  ※ 마우스 또는 터치로 정자 서명해주세요.
                </p>
              </div>
            </div>

            {/* 주소 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 :</span>
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
                  flex: 1
                }}
              />
            </label>

            {/* 연락처 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>연&nbsp;&nbsp;락&nbsp;&nbsp;처 :</span>
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
                  flex: 1
                }}
              />
            </label>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
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
      </article>
    </main>
  );
}

