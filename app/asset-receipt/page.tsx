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

interface AssetItem {
  id: number;
  assetCode: string;
  itemName: string;
  quantity: string;
  returnDate: string;
}

export default function AssetReceiptPage() {
  const receiptCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const returnCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const receiptDrawing = useRef(false);
  const returnDrawing = useRef(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  
  const [docType, setDocType] = useState<'receipt' | 'return'>('receipt');
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [hasReceiptSignature, setHasReceiptSignature] = useState(false);
  const [hasReturnSignature, setHasReturnSignature] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [receiptSignaturePreviewUrl, setReceiptSignaturePreviewUrl] = useState('');
  const [returnSignaturePreviewUrl, setReturnSignaturePreviewUrl] = useState('');
  
  const [assets, setAssets] = useState<AssetItem[]>([
    { id: 1, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 2, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 3, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 4, assetCode: '', itemName: '', quantity: '', returnDate: '' },
  ]);

  const tableWrapStyle: React.CSSProperties = {
    marginTop: 18,
    marginBottom: 18,
    overflowX: 'auto',
  };

  const tableOuterStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontWeight: 700,
    fontSize: 13,
    color: '#111827',
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: 6,
    borderBottom: '1px solid #f3f4f6',
    background: '#fff',
    verticalAlign: 'middle',
  };

  const cellInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const cellInputCenterStyle: React.CSSProperties = {
    ...cellInputStyle,
    textAlign: 'center',
  };

  // 서명 패드 설정
  const setupCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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

  useEffect(() => {
    setupCanvas(receiptCanvasRef);
    setupCanvas(returnCanvasRef);
    
    const handleResize = () => {
      setupCanvas(receiptCanvasRef);
      setupCanvas(returnCanvasRef);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // 확인서 타입 변경 시 드롭다운 닫기
  useEffect(() => {
    setIsCourseOpen(false);
  }, [docType]);

  const getCanvasCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>
  ) => {
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

  const startDrawing = (
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    drawingRef: React.MutableRefObject<boolean>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e, canvasRef);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    drawingRef: React.MutableRefObject<boolean>,
    setHasSignature: (value: boolean) => void
  ) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e, canvasRef);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDrawing = (drawingRef: React.MutableRefObject<boolean>) => {
    drawingRef.current = false;
    try {
      const canvas = drawingRef === receiptDrawing ? receiptCanvasRef.current : returnCanvasRef.current;
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        if (drawingRef === receiptDrawing) {
          setReceiptSignaturePreviewUrl(url);
        } else {
          setReturnSignaturePreviewUrl(url);
        }
      }
    } catch {
      // ignore
    }
  };

  const clearCanvas = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    setHasSignature: (value: boolean) => void
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (canvasRef === receiptCanvasRef) {
      setReceiptSignaturePreviewUrl('');
    } else {
      setReturnSignaturePreviewUrl('');
    }
  };

  const updateAsset = (id: number, field: keyof AssetItem, value: string) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  const isFormValid = () => {
    const hasAnyAsset = assets.some(asset => 
      asset.assetCode.trim() !== '' || 
      asset.itemName.trim() !== '' || 
      asset.quantity.trim() !== '' || 
      asset.returnDate.trim() !== ''
    );

    const hasRequiredSignature = docType === 'receipt' ? hasReceiptSignature : hasReturnSignature;
    return course !== '' && name.trim() !== '' && hasAnyAsset && hasRequiredSignature;
  };

  const generatePDF = async () => {
    if (!isFormValid() || isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      setIsCourseOpen(false);

      // DOM 업데이트(드롭다운 닫힘) 반영 대기
      await new Promise((r) => setTimeout(r, 50));

      const article = articleRef.current;
      if (!article) return;

      // PDF/프린트에 불필요한 UI 숨김
      const hideTargets = Array.from(article.querySelectorAll<HTMLElement>('[data-hide-in-pdf]'));
      const originalDisplays = hideTargets.map((el) => el.style.display);
      hideTargets.forEach((el) => {
        el.style.display = 'none';
      });

      // 출력(PDF)용: 입력 폼 숨기고 요약 블록 표시
      article.setAttribute('data-output-mode', '1');
      await new Promise((r) => setTimeout(r, 200));

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

      // 출력 모드 해제
      article.removeAttribute('data-output-mode');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgAspectRatio = canvas.width / canvas.height;

      const pdfWidth = 210;
      const pdfHeight = 297;
      const topMargin = 10;
      const bottomMargin = 10;
      const sideMargin = 15;

      const availableWidth = pdfWidth - sideMargin * 2;
      const availableHeightPerPage = pdfHeight - topMargin - bottomMargin;

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
          if (!pageCtx) continue;
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          pdf.addImage(pageImgData, 'PNG', sideMargin, topMargin, imgWidth, availableHeightPerPage, undefined, 'FAST');
        }
      } else {
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', sideMargin, topMargin, imgWidth, imgHeight, undefined, 'FAST');
      }

      const fileName = docType === 'receipt' ? '자산지급-수령확인서.pdf' : '자산반납-확인서.pdf';
      pdf.save(fileName);
    } catch (e) {
      console.error('PDF 생성 오류:', e);
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
          {docType === 'receipt' ? '자산지급 수령확인서' : '자산반납 확인서'}
        </h1>

        {/* 제목 선택 */}
        <div data-hide-in-pdf style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="radio"
              name="assetDocType"
              value="receipt"
              checked={docType === 'receipt'}
              onChange={() => setDocType('receipt')}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            자산지급 수령확인서
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="radio"
              name="assetDocType"
              value="return"
              checked={docType === 'return'}
              onChange={() => setDocType('return')}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            자산반납 확인서
          </label>
        </div>

        {/* 자산 목록 테이블 */}
        <div style={tableWrapStyle}>
          <div style={tableOuterStyle}>
          <table style={tableStyle}>
            <thead data-form-block>
              <tr>
                <th style={{ ...thStyle, minWidth: 50 }}>연번</th>
                <th style={{ ...thStyle, minWidth: 120, textAlign: 'left', paddingLeft: 12 }}>자산코드</th>
                <th style={{ ...thStyle, minWidth: 150, textAlign: 'left', paddingLeft: 12 }}>품명</th>
                <th style={{ ...thStyle, minWidth: 80 }}>수량</th>
                <th style={{ ...thStyle, minWidth: 120 }}>{docType === 'receipt' ? '수령일자' : '반납일자'}</th>
              </tr>
            </thead>
            <thead data-summary-block>
              <tr>
                <th style={{ ...thStyle, width: '8%' }}>연번</th>
                <th style={{ ...thStyle, width: '20%', textAlign: 'left', paddingLeft: 12 }}>자산코드</th>
                <th style={{ ...thStyle, width: '35%', textAlign: 'left', paddingLeft: 12 }}>품명</th>
                <th style={{ ...thStyle, width: '12%' }}>수량</th>
                <th style={{ ...thStyle, width: '25%' }}>{docType === 'receipt' ? '수령일자' : '반납일자'}</th>
              </tr>
            </thead>
            <tbody data-form-block>
              {assets.map((asset, index) => (
                <tr key={asset.id} style={{ background: index % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', width: 60 }}>{index + 1}</td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={asset.assetCode}
                      onChange={(e) => updateAsset(asset.id, 'assetCode', e.target.value)}
                      placeholder="예: A-001"
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={asset.itemName}
                      onChange={(e) => updateAsset(asset.id, 'itemName', e.target.value)}
                      placeholder="예: 노트북"
                      style={cellInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={asset.quantity}
                      onChange={(e) => updateAsset(asset.id, 'quantity', e.target.value)}
                      placeholder="1"
                      inputMode="numeric"
                      style={cellInputCenterStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={asset.returnDate}
                      onChange={(e) => updateAsset(asset.id, 'returnDate', e.target.value)}
                      onClick={(e) => {
                        e.currentTarget.showPicker?.();
                      }}
                      onFocus={(e) => {
                        e.currentTarget.showPicker?.();
                      }}
                      style={{ ...cellInputStyle, cursor: 'pointer', WebkitAppearance: 'none' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tbody data-summary-block>
              {assets
                .map((asset, index) => ({ ...asset, originalIndex: index }))
                .filter(asset => 
                  (asset.assetCode && asset.assetCode.trim()) || 
                  (asset.itemName && asset.itemName.trim()) || 
                  (asset.quantity && asset.quantity.trim()) || 
                  (asset.returnDate && asset.returnDate.trim())
                )
                .map((asset, filteredIndex) => (
                  <tr key={asset.id} style={{ background: filteredIndex % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fff', verticalAlign: 'middle', textAlign: 'center', width: '8%', fontSize: 12 }}>{asset.originalIndex + 1}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fff', verticalAlign: 'middle', textAlign: 'left', paddingLeft: 12, width: '20%', fontSize: 12 }}>{asset.assetCode}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fff', verticalAlign: 'middle', textAlign: 'left', paddingLeft: 12, width: '35%', fontSize: 12 }}>{asset.itemName}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fff', verticalAlign: 'middle', textAlign: 'center', width: '12%', fontSize: 12 }}>{asset.quantity}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fff', verticalAlign: 'middle', textAlign: 'center', width: '25%', fontSize: 12 }}>{asset.returnDate}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          </div>
        </div>

        {/* 자산 수령 시 */}
        {docType === 'receipt' && (
        <section style={{ marginTop: 40, marginBottom: 40 }}>
          <p style={{ marginBottom: 48, textAlign: 'center' }}>
            상기 자산코드 또는 자산명 및 수량을 이상없이 수령하였음을 확인합니다.
          </p>
          
          {/* PDF 출력용 요약 블록 (표 형태) */}
          <div data-summary-block style={{ marginTop: 48, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <tbody>
                <tr style={{ display: 'table-row' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>확인일</td>
                  <td style={{ padding: '6px 4px', width: '15%', whiteSpace: 'nowrap' }}>{new Date().toISOString().split('T')[0]}</td>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>교육명</td>
                  <td style={{ padding: '6px 4px', width: '38%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course || '-'}</td>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>성명</td>
                  <td style={{ padding: '6px 4px', width: '23%', position: 'relative' }}>
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                      {name.trim() || '-'}
                      {receiptSignaturePreviewUrl && (
                        <img
                          src={receiptSignaturePreviewUrl}
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
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* 입력 폼 블록 */}
          <div data-form-block>
            {/* 상단 2열: 확인일 / 교육명 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>확인일:</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  onClick={(e) => {
                    e.currentTarget.showPicker?.();
                  }}
                  onFocus={(e) => {
                    e.currentTarget.showPicker?.();
                  }}
                  style={{ 
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>교육명:</label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
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
                    boxSizing: 'border-box'
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
            </div>
          </div>

          {/* 하단 2열: 성명 / 서명 */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32, alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>성명:</label>
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>서명</div>
              <div style={{ position: 'relative', width: '100%' }}>
                <canvas
                  ref={receiptCanvasRef}
                  style={{
                    width: '100%',
                    height: 120,
                    border: '1px solid #000',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'crosshair',
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => startDrawing(e, receiptCanvasRef, receiptDrawing)}
                  onPointerMove={(e) => draw(e, receiptCanvasRef, receiptDrawing, setHasReceiptSignature)}
                  onPointerUp={() => endDrawing(receiptDrawing)}
                  onPointerLeave={() => endDrawing(receiptDrawing)}
                  onTouchStart={(e) => startDrawing(e, receiptCanvasRef, receiptDrawing)}
                  onTouchMove={(e) => draw(e, receiptCanvasRef, receiptDrawing, setHasReceiptSignature)}
                  onTouchEnd={() => endDrawing(receiptDrawing)}
                />
                <button
                  onClick={() => clearCanvas(receiptCanvasRef, setHasReceiptSignature)}
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
                  }}
                >
                  🗑️ 지우기
                </button>
              </div>
            </div>
          </div>
          </div>
        </section>
        )}

        {/* 자산 반납 시 */}
        {docType === 'return' && (
        <section style={{ marginTop: 40, marginBottom: 40 }}>
          <p style={{ marginBottom: 48, textAlign: 'center' }}>
            상기 자산 반납을 확인합니다.
          </p>

          {/* PDF 출력용 요약 블록 (표 형태) */}
          <div data-summary-block style={{ marginTop: 48, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <tbody>
                <tr style={{ display: 'table-row' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>확인일</td>
                  <td style={{ padding: '6px 4px', width: '15%', whiteSpace: 'nowrap' }}>{new Date().toISOString().split('T')[0]}</td>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>교육명</td>
                  <td style={{ padding: '6px 4px', width: '38%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course || '-'}</td>
                  <td style={{ padding: '6px 4px', fontWeight: 'bold', width: '8%', whiteSpace: 'nowrap' }}>성명</td>
                  <td style={{ padding: '6px 4px', width: '23%', position: 'relative' }}>
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                      {name.trim() || '-'}
                      {returnSignaturePreviewUrl && (
                        <img
                          src={returnSignaturePreviewUrl}
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
                </tr>
              </tbody>
            </table>
          </div>

          {/* 입력 폼 블록 */}
          <div data-form-block>
            {/* 상단 2열: 확인일 / 교육명 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>확인일:</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  onClick={(e) => {
                    e.currentTarget.showPicker?.();
                  }}
                  onFocus={(e) => {
                    e.currentTarget.showPicker?.();
                  }}
                  style={{ 
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>교육명:</label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
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
                    boxSizing: 'border-box'
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
            </div>
          </div>

          {/* 하단 2열: 성명 / 서명 */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 32, alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>성명:</label>
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>서명</div>
              <div style={{ position: 'relative', width: '100%' }}>
                <canvas
                  ref={returnCanvasRef}
                  style={{
                    width: '100%',
                    height: 120,
                    border: '1px solid #000',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'crosshair',
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => startDrawing(e, returnCanvasRef, returnDrawing)}
                  onPointerMove={(e) => draw(e, returnCanvasRef, returnDrawing, setHasReturnSignature)}
                  onPointerUp={() => endDrawing(returnDrawing)}
                  onPointerLeave={() => endDrawing(returnDrawing)}
                  onTouchStart={(e) => startDrawing(e, returnCanvasRef, returnDrawing)}
                  onTouchMove={(e) => draw(e, returnCanvasRef, returnDrawing, setHasReturnSignature)}
                  onTouchEnd={() => endDrawing(returnDrawing)}
                />
                <button
                  onClick={() => clearCanvas(returnCanvasRef, setHasReturnSignature)}
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
                  }}
                >
                  🗑️ 지우기
                </button>
              </div>
            </div>
          </div>
          </div>
        </section>
        )}

        {/* 제출 버튼 */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            type="button"
            data-hide-in-pdf
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
            {isGeneratingPDF ? 'PDF 생성 중...' : '확인서 제출하기'}
          </button>
        </div>

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
          
          article thead[data-summary-block] {
            display: none !important;
          }
          
          article tbody[data-summary-block] {
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
            
            article [data-hide-in-pdf],
            article [data-hide-in-print] {
              display: none !important;
            }
            
            article [data-form-block] {
              display: none !important;
            }
            
            article thead[data-form-block] {
              display: none !important;
            }
            
            article tbody[data-form-block] {
              display: none !important;
            }
            
            article [data-summary-block] {
              display: table-row-group !important;
            }
            
            article thead[data-summary-block] {
              display: table-header-group !important;
            }
            
            article tbody[data-summary-block] {
              display: table-row-group !important;
            }
          }

          /* PDF 저장 시: 입력 폼 숨김 + 요약 표시 */
          article[data-output-mode='1'] [data-form-block] {
            display: none !important;
          }
          
          article[data-output-mode='1'] thead[data-form-block] {
            display: none !important;
          }
          
          article[data-output-mode='1'] tbody[data-form-block] {
            display: none !important;
          }
          
          article[data-output-mode='1'] [data-summary-block] {
            display: table-row-group !important;
          }
          
          article[data-output-mode='1'] thead[data-summary-block] {
            display: table-header-group !important;
          }
          
          article[data-output-mode='1'] tbody[data-summary-block] {
            display: table-row-group !important;
          }
          
          article[data-output-mode='1'] [data-hide-in-pdf],
          article[data-output-mode='1'] [data-hide-in-print] {
            display: none !important;
          }
          article[data-output-mode='1'] {
            line-height: 2.25 !important;
            padding: 10px 32px 10px 60px !important;
          }
          article[data-output-mode='1'] p {
            margin: 6.75px 0 !important;
            line-height: 1.8 !important;
          }
        `}</style>
      </article>
    </main>
  );
}

