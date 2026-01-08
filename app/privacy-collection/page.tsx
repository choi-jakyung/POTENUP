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

export default function PrivacyCollectionPage() {
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
      pdf.save(`${name}_개인정보수집이용제공동의서_${date}.pdf`);
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
        <section style={{ marginTop: 40, marginBottom: 40, padding: 24, border: '2px solid #1976d2', borderRadius: 12, background: '#fff' }}>
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

