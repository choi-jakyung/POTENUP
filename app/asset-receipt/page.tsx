'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
  
  const [course, setCourse] = useState('');
  const [name, setName] = useState('');
  const [hasReceiptSignature, setHasReceiptSignature] = useState(false);
  const [hasReturnSignature, setHasReturnSignature] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  
  const [assets, setAssets] = useState<AssetItem[]>([
    { id: 1, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 2, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 3, assetCode: '', itemName: '', quantity: '', returnDate: '' },
    { id: 4, assetCode: '', itemName: '', quantity: '', returnDate: '' },
  ]);

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
    return course !== '' && name.trim() !== '' && hasAnyAsset && hasReceiptSignature && hasReturnSignature;
  };

  return (
    <main style={{ background: '#f5f5f5', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article style={{ 
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
          자산 지급 수령/반납 확인서
        </h1>

        {/* 자산 목록 테이블 */}
        <div style={{ marginTop: 30, marginBottom: 30, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
            <thead>
              <tr style={{ background: '#f8f8f8' }}>
                <th style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 'bold', minWidth: 50 }}>연번</th>
                <th style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 'bold', minWidth: 120 }}>자산코드</th>
                <th style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 'bold', minWidth: 150 }}>품명</th>
                <th style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 'bold', minWidth: 80 }}>수량</th>
                <th style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 'bold', minWidth: 120 }}>반납일자</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={asset.id}>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <input
                      type="text"
                      value={asset.assetCode}
                      onChange={(e) => updateAsset(asset.id, 'assetCode', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '6px', fontSize: 14 }}
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <input
                      type="text"
                      value={asset.itemName}
                      onChange={(e) => updateAsset(asset.id, 'itemName', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '6px', fontSize: 14 }}
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <input
                      type="text"
                      value={asset.quantity}
                      onChange={(e) => updateAsset(asset.id, 'quantity', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '6px', fontSize: 14, textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <input
                      type="date"
                      value={asset.returnDate}
                      onChange={(e) => updateAsset(asset.id, 'returnDate', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '6px', fontSize: 14 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 자산 수령 시 */}
        <section style={{ marginTop: 40, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
            [자산 수령 시]
          </h2>
          <p style={{ marginBottom: 20 }}>
            상기 자산코드 또는 자산명 이상 없이 수령하였음을 확인합니다.
          </p>
          
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>확인일:</label>
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                style={{ 
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14
                }} 
              />
            </div>
            
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>교육명:</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsCourseOpen(!isCourseOpen)}
                  style={{
                    width: '100%',
                    padding: '10px',
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
                  <span style={{ transform: isCourseOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▲</span>
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
                    {courses.map((courseOption) => (
                      <div
                        key={courseOption}
                        onClick={() => {
                          setCourse(courseOption);
                          setIsCourseOpen(false);
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          backgroundColor: course === courseOption ? '#e3f2fd' : '#fff'
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

          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>성명:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성명을 입력하세요"
              style={{
                width: '100%',
                maxWidth: 300,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>확인자:</span>
              <span style={{ marginLeft: 8 }}>주식회사 원티드랩 담당자 소속</span>
              <span style={{ marginLeft: 20, fontSize: 12 }}>(인)</span>
            </div>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <canvas
                ref={receiptCanvasRef}
                style={{
                  width: '100%',
                  height: 120,
                  border: '1px solid #000',
                  borderRadius: 8,
                  background: '#fff',
                  cursor: 'crosshair',
                  touchAction: 'none'
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
                  fontSize: 12
                }}
              >
                🗑️ 지우기
              </button>
            </div>
          </div>
        </section>

        {/* 자산 반납 시 */}
        <section style={{ marginTop: 60, marginBottom: 40, paddingTop: 40, borderTop: '2px solid #ddd' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
            [자산 반납 시]
          </h2>
          <p style={{ marginBottom: 20 }}>
            상기 반납 확인된 사항에 대해 등록합니다.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>확인일:</span>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>교육명:</label>
                <input 
                  type="text"
                  value={course}
                  readOnly
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#f5f5f5'
                  }} 
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>성명:</label>
                <input 
                  type="text"
                  value={name}
                  readOnly
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#f5f5f5'
                  }} 
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>확인자:</span>
              <span style={{ marginLeft: 8 }}>주식회사 원티드랩 담당자 소속</span>
              <span style={{ marginLeft: 20, fontSize: 12 }}>(인)</span>
            </div>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <canvas
                ref={returnCanvasRef}
                style={{
                  width: '100%',
                  height: 120,
                  border: '1px solid #000',
                  borderRadius: 8,
                  background: '#fff',
                  cursor: 'crosshair',
                  touchAction: 'none'
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
                  fontSize: 12
                }}
              >
                🗑️ 지우기
              </button>
            </div>
          </div>
        </section>

        {/* 제출 버튼 */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { if (isFormValid()) alert('확인서가 제출되었습니다.'); }}
            disabled={!isFormValid()}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderRadius: 12,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
              background: isFormValid() ? '#1976d2' : '#ccc',
              color: isFormValid() ? '#fff' : '#999'
            }}
          >
            확인서 제출하기
          </button>
        </div>
      </article>
    </main>
  );
}

