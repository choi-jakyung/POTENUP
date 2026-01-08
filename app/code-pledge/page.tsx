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
  const [contact, setContact] = useState('010-0000-0000');
  const [agreed, setAgreed] = useState(false);
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
    const isContactValid = contact.trim() !== '' && contact !== '010-0000-0000' && contact.length >= 13;
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
      if (!article) return;
      const clearButton = clearButtonRef.current;
      const originalDisplay = clearButton?.style.display || '';
      if (clearButton) clearButton.style.display = 'none';
      const articleScrollHeight = Math.max(article.scrollHeight, article.offsetHeight, article.clientHeight);
      const articleScrollWidth = Math.max(article.scrollWidth, article.offsetWidth, article.clientWidth);
      const canvas = await html2canvas(article, {
        useCORS: true, logging: false, backgroundColor: '#ffffff', scale: 2,
        width: articleScrollWidth, height: articleScrollHeight + 20,
        windowWidth: articleScrollWidth, windowHeight: articleScrollHeight + 20,
        allowTaint: true, scrollX: 0, scrollY: 0,
      } as any);
      if (clearButton) clearButton.style.display = originalDisplay || '';
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210, pdfHeight = 297, topMargin = 10, bottomMargin = 10, sideMargin = 15;
      const imgAspectRatio = canvas.width / canvas.height;
      const availableWidth = pdfWidth - (sideMargin * 2);
      const availableHeightPerPage = pdfHeight - topMargin - bottomMargin;
      const imgWidth = availableWidth, imgHeight = availableWidth / imgAspectRatio;
      if (imgHeight > availableHeightPerPage) {
        const totalPages = Math.ceil(imgHeight / availableHeightPerPage);
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const sourceY = (canvas.height / totalPages) * page;
          const sourceHeight = canvas.height / totalPages;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width; pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(pageImgData, 'PNG', sideMargin, topMargin, imgWidth, availableHeightPerPage, undefined, 'FAST');
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', sideMargin, topMargin, imgWidth, imgHeight, undefined, 'FAST');
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
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article ref={articleRef} style={{ maxWidth: 860, margin: '0 auto', fontSize: 14, lineHeight: 1.9 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <Image src="/wanted-logo.png" alt="wanted logo" width={96} height={96} style={{ objectFit: 'contain' }} unoptimized />
          </Link>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' }}>
          행동 강령 서약서
        </h1>

        <p style={{ marginBottom: 30, textAlign: 'center', fontSize: 15, lineHeight: 1.8 }}>
          본인은 (주)원티드랩이 주관하는 포텐업 교육 과정의 훈련생으로서, 교육에 참여하는 기간 동안 다음의 사항을 준수할 것을 서약합니다.
        </p>

        <div style={{
          marginTop: 40,
          padding: 24,
          border: '1px solid #999',
          borderRadius: 12,
          background: '#fafafa'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 16, paddingLeft: 0 }}>
              1. 타인과 불필요한 신체 접촉을 하지 않도록 주의하겠습니다.
            </li>
            <li style={{ marginBottom: 16, paddingLeft: 0 }}>
              2. 대화에 욕설, 비속어, 은어(상대방이 수치심을 느낄 수 있는 언어)를 사용하지 않고 상대방을 존중하는 언어를 사용하겠습니다.
            </li>
            <li style={{ marginBottom: 16, paddingLeft: 0 }}>
              3. 화를 내거나 과격한 몸짓, 언성을 높이는 행위 등으로 상대방을 위협하거나 어떠한 폭력도 행사하지 않겠습니다.
            </li>
            <li style={{ marginBottom: 16, paddingLeft: 0 }}>
              4. 성별, 정치적 성향, 국적, 인종, 지역, 종교, 나이, 사회적 신분, 학력, 외모, 성적 지향 장애, 질병 등 나와 다름에 있어서 차별하거나 강요하지 않겠습니다.
            </li>
            <li style={{ marginBottom: 16, paddingLeft: 0 }}>
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
          <div style={{ marginTop: 40, border: '1px solid #eee', borderRadius: 8, padding: 24 }}>
            {/* 서약일 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ minWidth: 120, fontSize: 14, fontWeight: 'bold' }}>서&nbsp;&nbsp;약&nbsp;&nbsp;일 :</span>
              <input 
                type="date" 
                value={pledgeDate}
                onChange={(e) => setPledgeDate(e.target.value)}
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
                <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCourseOpen(!isCourseOpen);
                    }}
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
                      minWidth: 150
                    }}
                  >
                    <span>{course || '선택'}</span>
                    <span style={{ transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▼
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
                        <div
                          key={courseOption}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCourse(courseOption);
                            setIsCourseOpen(false);
                          }}
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < courses.length - 1 ? '1px solid #f0f0f0' : 'none',
                            backgroundColor: course === courseOption ? '#e3f2fd' : '#fff',
                            transition: 'background-color 0.2s'
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
                          {courseOption}
                        </div>
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

          <div style={{ marginTop: 32, marginBottom: 24 }}>
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
              {isGeneratingPDF ? 'PDF 생성 중...' : '서약서 제출하기'}
            </button>
          </div>
        </section>
      </article>
    </main>
  );
}

