'use client';

import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PledgePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [course, setCourse] = useState('');
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('010-0000-0000');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isContactFocused, setIsContactFocused] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);

  /* ===== 서명 패드 세팅 (좌표 정확 + 터치 지원) ===== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      try {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const ratio = window.devicePixelRatio || 1;
        
        // 실제 canvas 크기 설정
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        
        // 컨텍스트 스케일 조정
        ctx.scale(ratio, ratio);
        
        // 그리기 설정
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
      } catch (error) {
        console.error('Canvas setup error:', error);
      }
    };

    // 초기 설정 (약간의 지연을 두어 DOM이 완전히 렌더링된 후 실행)
    const timer = setTimeout(() => {
      setCanvasSize();
    }, 100);
    
    // 리사이즈 이벤트
    window.addEventListener('resize', setCanvasSize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', setCanvasSize);
    };
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
    
    // ctx.scale(ratio, ratio)를 사용하므로 좌표는 표시 크기 기준으로 계산
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return { x, y };
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
    
    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const end = (e?: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) {
      e.preventDefault();
    }
    drawing.current = false;
    if (checkSignature()) {
      setHasSignature(true);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // 서명이 있는지 확인하는 함수
  const checkSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((channel, index) => index % 4 !== 3 && channel !== 0);
  };

  // 외부 클릭 시 아코디언 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCourseOpen && !target.closest('[data-course-dropdown]')) {
        setIsCourseOpen(false);
      }
    };

    if (isCourseOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCourseOpen]);

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

  // 모든 필수 항목이 작성되었는지 확인
  const isFormValid = () => {
    const isContactValid = contact.trim() !== '' && contact !== '010-0000-0000' && contact.length >= 13;
    return (
      course !== '' &&
      name.trim() !== '' &&
      address.trim() !== '' &&
      isContactValid &&
      hasSignature &&
      agreed
    );
  };

  // PDF로 저장하는 함수
  const saveAsPDF = async () => {
    if (!isFormValid()) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const article = articleRef.current;
      if (!article) {
        alert('PDF 생성에 실패했습니다. 페이지를 새로고침해주세요.');
        setIsGeneratingPDF(false);
        return;
      }

      // PDF 생성 전에 지우기 버튼 숨기기
      const clearButton = clearButtonRef.current;
      const originalDisplay = clearButton?.style.display || '';
      if (clearButton) {
        clearButton.style.display = 'none';
      }

      // article의 실제 크기 측정 (로고부터 저작권까지 전체)
      // 약간의 여유를 두어 잘림 방지
      const articleScrollHeight = Math.max(
        article.scrollHeight,
        article.offsetHeight,
        article.clientHeight
      );
      const articleScrollWidth = Math.max(
        article.scrollWidth,
        article.offsetWidth,
        article.clientWidth
      );
      
      // html2canvas로 고해상도 캡처 (전체 내용 정확히 캡처)
      const canvas = await html2canvas(article, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // 해상도 2배로 증가
        width: articleScrollWidth,
        height: articleScrollHeight + 20, // 여유 공간 추가
        windowWidth: articleScrollWidth,
        windowHeight: articleScrollHeight + 20,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      } as any);

      // 지우기 버튼 다시 보이기
      if (clearButton) {
        clearButton.style.display = originalDisplay || '';
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // PDF 생성 (A4 사이즈)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const topMargin = 10; // 로고 위 여백 (mm)
      const sideMargin = 15; // 좌우 여백 (mm)

      // 이미지 비율 계산
      const imgAspectRatio = canvas.width / canvas.height;
      const availableHeight = pdfHeight - topMargin; // 여백을 뺀 사용 가능한 높이
      const availableWidth = pdfWidth - (sideMargin * 2); // 좌우 여백을 뺀 사용 가능한 너비
      
      // 좌우 여백을 정확히 동일하게 맞추기 위해 너비를 고정
      const imgWidth = availableWidth; // 좌우 여백을 뺀 너비 사용 (항상 고정)
      let imgHeight = availableWidth / imgAspectRatio; // 비율에 맞춰 높이 계산
      
      // 높이가 사용 가능한 높이를 초과하면 높이만 조정 (너비는 고정 유지)
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        // 너비는 availableWidth로 고정하여 좌우 여백이 항상 동일하게 유지
      }

      // 좌우 여백이 정확히 동일하도록 위치 설정
      const x = sideMargin; // 왼쪽 여백 = sideMargin
      const y = topMargin; // 로고 위 여백
      
      // 검증: 오른쪽 여백 = pdfWidth - x - imgWidth = pdfWidth - sideMargin - availableWidth
      // = pdfWidth - sideMargin - (pdfWidth - sideMargin * 2) = sideMargin (동일함)

      // 한 페이지에 이미지 추가 (좌우 여백이 정확히 동일하게)
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // 파일명 생성 (성명_날짜 형식)
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${name}_자산관리서약서_${date}.pdf`;
      
      // PDF 저장
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const courses = [
    'AI Agent & 언리얼 개발 협업과정',
    '게임 개발자 양성과정',
    'AI기반 FE & BE 협업과정',
  ];

  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article ref={articleRef} style={{ maxWidth: 860, margin: '0 auto', fontSize: 14, lineHeight: 1.9 }}>
        
        {/* 헤더: 로고 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ width: 96, height: 96, position: 'relative' }}>
            <img
              src="/wanted-logo.png"
              alt="wanted logo"
              width={96}
              height={96}
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                // 이미지 로드 실패 시 숨김
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' }}>
          자산 관리 서약서
        </h1>

        <p>
          본인은 아래 사항을 충분히 숙지하고 동의하며, 이를 성실히 준수할 것임을 서약합니다.
        </p>

        <div style={{ marginTop: 20 }}>
          <p>1. ㈜원티드랩(이하 ‘교육기관’)으로부터 지급된 모든 물품은 교육기관의 자산임을 인식하고 이를 철저히 관리하는 것에 동의합니다.</p>
          <p>2. 전항의 자산은 타인에게 대여할 수 없으며, 본인이 교육 수강 용도로만 사용하는 것에 동의합니다.</p>
          <p>3. 1항의 자산에 인가되지 않은 불법 소프트웨어 설치 또는 사용으로 인한 자산 훼손 등 및/또는 제3자의 지적재산권 침해 등으로 인한 민/형사상 책임은 본인이 부담하며, 그에 따라 교육 수강 제한됨에 동의합니다.</p>
          <p>4. 1항의 자산에 관한 내역 [첨부1. 자산수령/반납확인서]을 모두 확인하였으며, 아래 “원티드랩 내부 자산 손∙망실 처리 규정” 일부를 준수하는 것에 동의합니다.</p>
          <p>
            5. 1항의 자산은 교육 종료 즉시 교육기관에 전부 반납하는 것에 동의합니다.
            <br />
            <span style={{ paddingLeft: 20 }}>※ 미 반납품은 [내부 자산 손∙망실 처리규정] “망실” 적용</span>
          </p>
          <p>
            6. 1항의 자산에 임의로 USIM칩 및 부착물(스티커 포함) 등은 부착하지 않겠습니다.
            <br />
            <span style={{ paddingLeft: 20 }}>※ 부착물로 인한 자산 손상 시 “내부 자산 손∙망실 처리 규정”이 적용될 수 있습니다.</span>
          </p>
        </div>

        {/* 내부 규정 박스 */}
        <div
          style={{
            marginTop: 40,
            padding: 24,
            border: '1px solid #999',
            borderRadius: 12,
            background: '#fafafa',
          }}
        >
          <strong>[내부 자산 손∙망실 처리 규정]</strong>

          <div style={{ marginTop: 16 }}>
            <p><b>개인 과실로 인한 손실(파손)</b></p>

            <p style={{ paddingLeft: 16 }}>수리 가능의 경우 :</p>
            <p style={{ paddingLeft: 32 }}>· 10만원 이상 : 개인과실 비율은 자산관리자의 실사용자가 확인하여 결정</p>
            <p style={{ paddingLeft: 32 }}>· 10만원 미만 : 수리비 전액 사용자 부담</p>

            <p style={{ paddingLeft: 16, marginTop: 8 }}>수리 불가능의 경우 :</p>
            <p style={{ paddingLeft: 32 }}>· 손실 시점 장부상 잔존 가액 전액 개인 부담.</p>
            <p style={{ paddingLeft: 32 }}>· 자산가액이 설정되어 있지 않은 물품은 구입비용의 50% 개인 부담.</p>
            <p style={{ paddingLeft: 32 }}>· 자연 손실 및 제품 하자로 인한 수리는 전액 회사 부담.</p>

            <p style={{ marginTop: 16 }}><b>개인 부주의로 인한 망실(분실)</b></p>
            <p style={{ paddingLeft: 16 }}>· 망실 시점 장부상 잔존 가액 전액 부담.</p>
          </div>
        </div>

        {/* 강조 문구 */}
        <div style={{ marginTop: 36, padding: 18, background: '#E3F2FD', borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>
          위 모든 사항을 숙지하고 이를 성실히 준수할 것을 서약합니다.
        </div>

        {/* 입력 영역 */}
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
                        fontSize: 14,
                        minWidth: 150,
                      }}
                    >
                      <span>{course || '선택'}</span>
                      <span style={{ transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▲
                      </span>
                    </button>
                    
                    {isCourseOpen && (
                      <div
                        style={{
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
                        }}
                      >
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
                              backgroundColor: course === courseOption ? '#e3f2fd' : '#fff',
                              borderRadius: index === 0 ? '8px 8px 0 0' : index === courses.length - 1 ? '0 0 8px 8px' : '0',
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
                    // 포맷이 완전하지 않으면 다시 포맷팅
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
                  flex: 1,
                }}
              />
            </label>
          </div>

          {/* 동의 체크박스 */}
          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', borderRadius: 4 }}
              />
              <span style={{ fontSize: 14 }}>
                위 서약 내용을 모두 확인하였으며, 이에 동의합니다.
              </span>
            </label>
          </div>

          {/* PDF 저장 버튼 */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              type="button"
              onClick={saveAsPDF}
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
                color: isFormValid() && !isGeneratingPDF ? '#fff' : '#999',
                transition: 'all 0.2s',
              }}
            >
              {isGeneratingPDF ? 'PDF 생성 중...' : '서약서를 PDF로 저장하기'}
            </button>
          </div>
        </section>

        {/* 푸터 */}
        <footer style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>

      </article>
    </main>
  );
}
