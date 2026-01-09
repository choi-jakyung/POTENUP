'use client';

import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Link from 'next/link';

const courses = [
  'AI Agent & 언리얼 개발 협업과정',
  '게임 개발자 양성과정',
  'AI기반 FE & BE 협업과정'
];

export default function PledgePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const originalPrintScaleRef = useRef<string | null>(null);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [course, setCourse] = useState('');
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ===== 인쇄(A4 1페이지) 최적화: print 시 자동 축소(scale) =====
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const A4_HEIGHT_PX = 1122; // 297mm @ 96dpi(대략)
    const SAFE_MARGIN_PX = 24; // 상/하 여유

    const applyPrintScaleToFitOnePage = () => {
      const el = articleRef.current;
      if (!el) return;

      // 기존 값 백업
      if (originalPrintScaleRef.current == null) {
        originalPrintScaleRef.current = el.style.getPropertyValue('--print-scale') || '1';
      }

      // 레이아웃 반영 후 측정
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const currentHeight = rect.height || el.scrollHeight;
        const availableHeight = A4_HEIGHT_PX - SAFE_MARGIN_PX;

        if (!currentHeight || currentHeight <= 0) {
          el.style.setProperty('--print-scale', '1');
          return;
        }

        const scale = Math.min(1, availableHeight / currentHeight);
        el.style.setProperty('--print-scale', String(Number(scale.toFixed(4))));
      });
    };

    const resetPrintScale = () => {
      const el = articleRef.current;
      if (!el) return;
      el.style.setProperty('--print-scale', originalPrintScaleRef.current || '1');
      originalPrintScaleRef.current = null;
    };

    // Chrome/Edge: matchMedia('print') 변화 감지
    const mql = window.matchMedia?.('print');
    const onMqlChange = (e: MediaQueryListEvent) => {
      if (e.matches) applyPrintScaleToFitOnePage();
      else resetPrintScale();
    };

    // 일부 브라우저: beforeprint/afterprint
    const onBeforePrint = () => applyPrintScaleToFitOnePage();
    const onAfterPrint = () => resetPrintScale();

    try {
      mql?.addEventListener?.('change', onMqlChange);
    } catch {
      // ignore
    }

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    return () => {
      try {
        mql?.removeEventListener?.('change', onMqlChange);
      } catch {
        // ignore
      }
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      resetPrintScale();
    };
  }, []);

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
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          setSignaturePreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // ignore
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignaturePreviewUrl('');
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

  const sanitizeContactInput = (value: string) => value.replace(/[^\d]/g, '').slice(0, 11);

  // 모든 필수 항목이 작성되었는지 확인
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
      
      // A4 용지 크기에 맞춰 캔버스 생성 (210mm = 794px at 96 DPI)
      const a4WidthPx = 794;
      
      // html2canvas로 고해상도 캡처 (전체 내용 정확히 캡처)
      const canvas = await html2canvas(article, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // 고해상도를 위해 scale 조정
        width: a4WidthPx,
        windowWidth: a4WidthPx,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY,
      } as any);

      // 지우기 버튼 다시 보이기
      if (clearButton) {
        clearButton.style.display = originalDisplay || '';
      }

      // 출력 모드 해제
      article.removeAttribute('data-output-mode');

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // PDF 생성 (A4 사이즈)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 용지 크기 (mm)
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 0; // 여백 없이 전체 페이지 사용

      // 이미지 비율 계산
      const imgAspectRatio = canvas.width / canvas.height;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeightPerPage = pdfHeight - (margin * 2);
      
      // 너비를 기준으로 이미지 크기 계산 (비율 유지)
      const imgWidth = availableWidth;
      const imgHeight = availableWidth / imgAspectRatio;
      
      // 여러 페이지로 나눠야 하는 경우
      if (imgHeight > availableHeightPerPage) {
        // 페이지 수 계산
        const totalPages = Math.ceil(imgHeight / availableHeightPerPage);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
      }

          // 현재 페이지에서 보여줄 이미지의 시작 위치 (원본 이미지 기준)
          const sourceY = (canvas.height / totalPages) * page;
          const sourceHeight = canvas.height / totalPages;
          
          // 임시 캔버스에 현재 페이지 부분만 추출
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            const pageImgHeight = availableHeightPerPage;
            
            pdf.addImage(
              pageImgData,
              'PNG',
              margin,
              margin,
              imgWidth,
              availableHeightPerPage,
              undefined,
              'FAST'
            );
          }
        }
      } else {
        // 한 페이지에 들어가는 경우
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      }

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

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '80px 24px 48px 24px' }}>
      <article
        id="pledge-article"
        ref={articleRef}
        style={{ 
        maxWidth: 794, 
        width: '100%',
          minHeight: 1122, // A4 세로(297mm) @ 96dpi 기준(대략)
        margin: '0 auto', 
        fontSize: 12, 
        lineHeight: 1.5,
        background: '#fff',
        padding: '16px 32px',
          boxSizing: 'border-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        // print 전용 스케일 변수 (기본 1)
        ['--print-scale' as any]: 1,
      }}>
        
        {/* 헤더: 로고 */}
        <div style={{ marginBottom: -60 }}>
          <Link href="/" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <div style={{ width: 150, height: 48.42, position: 'relative' }}>
            <img
              src="/wanted-logo.png"
              alt="wanted logo"
                width={150}
                height={150}
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                // 이미지 로드 실패 시 숨김
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          </Link>
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 72, marginBottom: 10, textAlign: 'center' }}>
          자산 관리 서약서
        </h1>

        <p style={{ margin: '9px 0' }}>
          본인은 아래 사항을 충분히 숙지하고 동의하며, 이를 성실히 준수할 것임을 서약합니다.
        </p>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>1. ㈜원티드랩(이하 &apos;교육기관&apos;)으로부터 지급된 모든 물품은 교육기관의 자산임을 인식하고 이를 철저히 관리하는 것에 동의합니다.</p>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>2. 전항의 자산은 타인에게 대여할 수 없으며, 본인이 교육 수강 용도로만 사용하는 것에 동의합니다.</p>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>3. 1항의 자산에 인가되지 않은 불법 소프트웨어 설치 또는 사용으로 인한 자산 훼손 등 및/또는 제3자의 지적재산권 침해 등으로 인한 민/형사상 책임은 본인이 부담하며, 그에 따라 교육 수강 제한됨에 동의합니다.</p>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>4. 1항의 자산에 관한 내역 [첨부1. 자산수령/반납확인서]을 모두 확인하였으며, 아래 &quot;원티드랩 내부 자산 손∙망실 처리 규정&quot; 일부를 준수하는 것에 동의합니다.</p>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>
            5. 1항의 자산은 교육 종료 즉시 교육기관에 전부 반납하는 것에 동의합니다.
            <br />
            <span style={{ paddingLeft: 20 }}>※ 미 반납품은 [내부 자산 손∙망실 처리규정] &quot;망실&quot; 적용</span>
          </p>
          <p style={{ margin: '4.5px 0', fontSize: 12, lineHeight: 1.8 }}>
            6. 1항의 자산에 임의로 USIM칩 및 부착물(스티커 포함) 등은 부착하지 않겠습니다.
            <br />
            <span style={{ paddingLeft: 20 }}>※ 부착물로 인한 자산 손상 시 &quot;내부 자산 손∙망실 처리 규정&quot;이 적용될 수 있습니다.</span>
          </p>
        </div>

        {/* 내부 규정 박스 */}
        <div
          data-asset-rule-box
          style={{
            marginTop: 8,
            marginBottom: 8,
            padding: 8,
            border: '1px solid #999',
            borderRadius: 6,
            background: '#fafafa',
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>[내부 자산 손∙망실 처리 규정]</strong>

          <div>
            <p style={{ margin: '3px 0', fontWeight: 'bold', fontSize: 11 }}>개인 과실로 인한 손실(파손)</p>

            <p style={{ paddingLeft: 12, margin: '1px 0', fontSize: 10 }}>수리 가능의 경우 :</p>
            <p style={{ paddingLeft: 24, margin: '1px 0', fontSize: 10 }}>· 10만원 이상 : 개인과실 비율은 자산관리자의 실사용자가 확인하여 결정</p>
            <p style={{ paddingLeft: 24, margin: '1px 0', fontSize: 10 }}>· 10만원 미만 : 수리비 전액 사용자 부담</p>

            <p style={{ paddingLeft: 12, margin: '1px 0', fontSize: 10 }}>수리 불가능의 경우 :</p>
            <p style={{ paddingLeft: 24, margin: '1px 0', fontSize: 10 }}>· 손실 시점 장부상 잔존 가액 전액 개인 부담.</p>
            <p style={{ paddingLeft: 24, margin: '1px 0', fontSize: 10 }}>· 자산가액이 설정되어 있지 않은 물품은 구입비용의 50% 개인 부담.</p>
            <p style={{ paddingLeft: 24, margin: '1px 0', fontSize: 10 }}>· 자연 손실 및 제품 하자로 인한 수리는 전액 회사 부담.</p>

            <p style={{ margin: '3px 0', fontWeight: 'bold', fontSize: 11 }}>개인 부주의로 인한 망실(분실)</p>
            <p style={{ paddingLeft: 12, margin: '1px 0', fontSize: 10 }}>· 망실 시점 장부상 잔존 가액 전액 부담.</p>
          </div>
        </div>

        {/* 강조 문구 */}
        <div style={{ marginTop: 8, marginBottom: 8, padding: 8, background: '#E3F2FD', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
          위 모든 사항을 숙지하고 이를 성실히 준수할 것을 서약합니다.
        </div>

        {/* 입력 영역 */}
        <section style={{ marginTop: 8 }}>
          {/* 입력 영역 */}
          <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
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
                            onMouseEnter={(e) => {
                                    if (course !== courseOption) e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                    if (course !== courseOption) e.currentTarget.style.backgroundColor = '#fff';
                            }}
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
                  </div>
                </>
              );
            })()}
          </div>

          {/* 동의 체크박스 */}
          <div data-form-block style={{ marginTop: 32, marginBottom: 24 }}>
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
          <div data-hide-in-print style={{ marginTop: 32, textAlign: 'center' }}>
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
              {isGeneratingPDF ? 'PDF 생성 중...' : '서약서 저장하기'}
            </button>
          </div>
        </section>

        {/* 인쇄(A4 1페이지) 전용 스타일 */}
        <style jsx global>{`
          @page {
            size: A4;
            margin: 8mm;
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

            #pledge-article {
              width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              padding: 8mm 8mm !important;
              box-shadow: none !important;
              transform: scale(var(--print-scale, 1)) !important;
              transform-origin: top center !important;
              line-height: 2.25 !important;
              font-size: 10px !important;
            }

            #pledge-article p {
              margin: 6px 0 !important;
              line-height: 1.8 !important;
            }

            #pledge-article h1 {
              font-size: 14px !important;
              margin-bottom: 8px !important;
            }

            #pledge-article h2 {
              font-size: 13px !important;
              margin: 10px 0 8px !important;
            }

            #pledge-article h3 {
              font-size: 12px !important;
              margin: 10px 0 6px !important;
            }

            #pledge-article p {
              margin: 0 0 6px !important;
            }

            #pledge-article ul,
            #pledge-article ol {
              margin: 0 0 8px !important;
            }

            #pledge-article [data-hide-in-print] {
              display: none !important;
            }

            #pledge-article [data-form-block] {
              display: none !important;
            }
            #pledge-article [data-summary-block] {
              display: block !important;
            }
          }

          /* 화면 기본: 요약 숨김 */
          #pledge-article [data-summary-block] {
            display: none;
          }

          /* 내부 규정 박스: PDF/인쇄 시 추가 압축 */
          @media print {
            #pledge-article [data-asset-rule-box] {
              font-size: 9px !important;
              line-height: 1.2 !important;
              padding: 6px !important;
            }
            #pledge-article [data-asset-rule-box] p {
              margin: 0.5px 0 !important;
            }
            #pledge-article [data-asset-rule-box] strong {
              font-size: 9px !important;
            }
          }

          /* PDF 저장 시: 입력 폼 숨김 + 요약 표시 + 간격 조정 */
          #pledge-article[data-output-mode='1'] [data-form-block] {
            display: none !important;
          }
          #pledge-article[data-output-mode='1'] [data-summary-block] {
            display: block !important;
          }
          #pledge-article[data-output-mode='1'] [data-hide-in-print] {
            display: none !important;
          }
          #pledge-article[data-output-mode='1'] {
            line-height: 2.25 !important;
            padding: 10px 32px 10px 60px !important;
          }
          #pledge-article[data-output-mode='1'] p {
            margin: 6.75px 0 !important;
            line-height: 1.8 !important;
          }
        `}</style>

        {/* 푸터 */}
        <footer style={{ marginTop: 8, marginBottom: 0, paddingTop: 4, paddingBottom: 0, borderTop: '1px solid rgb(224, 224, 224)', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'rgb(102, 102, 102)', margin: 0 }}>
            © 2026 ㈜원티드랩. All rights reserved.
          </p>
        </footer>

      </article>
    </main>
  );
}
