'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

export default function PhotoConsentPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('010-0000-0000');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isContactFocused, setIsContactFocused] = useState(false);

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
    const isContactValid = contact.trim() !== '' && contact !== '010-0000-0000';
    return name.trim() !== '' && isContactValid && hasSignature && agreed;
  };

  return (
    <main style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: '48px 24px' }}>
      <article style={{ maxWidth: 860, margin: '0 auto', fontSize: 14, lineHeight: 1.9 }}>
        <div style={{ marginBottom: 16 }}>
          <Image src="/wanted-logo.png" alt="wanted logo" width={96} height={96} style={{ objectFit: 'contain' }} unoptimized />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' }}>사진촬영 및 초상권 활용 동의서</h1>
        <p>사진촬영 및 초상권 활용 동의서 내용이 여기에 들어갑니다.</p>
        <section style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 80, fontSize: 14 }}>성&nbsp;&nbsp;명 :</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="성명을 입력하세요" style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
            </label>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 80, fontSize: 14 }}>연&nbsp;&nbsp;락&nbsp;&nbsp;처 :</span>
              <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} onFocus={() => { if (!isContactFocused && contact === '010-0000-0000') { setContact(''); setIsContactFocused(true); } }} onBlur={() => { if (contact.trim() === '') { setContact('010-0000-0000'); setIsContactFocused(false); } }} style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
            </label>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><span style={{ minWidth: 80, fontSize: 14 }}></span><span style={{ fontSize: 14 }}>(인)</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 80, fontSize: 14 }}></span>
              <div style={{ flex: 1, position: 'relative' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: 140, border: '1px solid #000', borderRadius: 8, background: '#fff', cursor: 'crosshair', touchAction: 'none' }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
                <button onClick={clear} style={{ position: 'absolute', bottom: 8, right: 8, padding: '6px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>🗑️ 지우기</button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 14 }}>위 내용을 모두 확인하였으며, 이에 동의합니다.</span>
            </label>
          </div>
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button type="button" onClick={() => { if (isFormValid()) alert('서약서가 제출되었습니다.'); }} disabled={!isFormValid()} style={{ width: '100%', maxWidth: 400, padding: '16px 32px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12, cursor: isFormValid() ? 'pointer' : 'not-allowed', background: isFormValid() ? '#1976d2' : '#ccc', color: isFormValid() ? '#fff' : '#999' }}>서약서 제출하기</button>
          </div>
        </section>
      </article>
    </main>
  );
}


