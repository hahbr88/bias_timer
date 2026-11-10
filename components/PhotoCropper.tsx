import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

const FRAME_SIZE = 300;

interface Point {
  x: number;
  y: number;
}

export function PhotoCropper({ file, onCancel, onApply }: { file: File; onCancel: () => void; onApply: (file: File) => Promise<void> | void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointer: Point; offset: Point } | null>(null);
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [applying, setApplying] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.max(1, Math.min(3, current - event.deltaY * 0.001)));
    };
    frame.addEventListener('wheel', handleWheel, { passive: false });
    return () => frame.removeEventListener('wheel', handleWheel);
  }, []);

  const baseScale = Math.max(FRAME_SIZE / size.width, FRAME_SIZE / size.height);
  const displaySize = useMemo(() => ({ width: size.width * baseScale * zoom, height: size.height * baseScale * zoom }), [size, baseScale, zoom]);
  const clamp = (point: Point, currentDisplay = displaySize): Point => ({
    x: Math.max(-(currentDisplay.width - FRAME_SIZE) / 2, Math.min((currentDisplay.width - FRAME_SIZE) / 2, point.x)),
    y: Math.max(-(currentDisplay.height - FRAME_SIZE) / 2, Math.min((currentDisplay.height - FRAME_SIZE) / 2, point.y)),
  });

  useEffect(() => { setOffset((current) => clamp(current)); }, [displaySize.width, displaySize.height]);

  function changeZoom(value: number) {
    setZoom(Math.max(1, Math.min(3, value)));
  }

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  async function apply() {
    const image = imageRef.current;
    if (!image) return;
    setApplying(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('사진을 편집할 수 없습니다.');
      const scale = Math.max(256 / size.width, 256 / size.height) * zoom;
      const width = size.width * scale;
      const height = size.height * scale;
      const ratio = 256 / FRAME_SIZE;
      context.drawImage(image, (256 - width) / 2 + offset.x * ratio, (256 - height) / 2 + offset.y * ratio, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('사진을 저장할 수 없습니다.')), 'image/webp', 0.88));
      await onApply(new File([blob], `cropped-${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }));
    } finally { setApplying(false); }
  }

  return <div className="fixed inset-0 z-50 flex flex-col bg-white p-4">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">프로필 사진 편집</h2><p className="text-xs text-slate-400">사진을 움직여 원하는 영역을 맞춰주세요.</p></div><button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" aria-label="사진 편집 닫기"><X size={20} /></button></div>
    <div ref={frameRef} className="mx-auto overflow-hidden rounded-2xl bg-slate-100 shadow-inner touch-none" style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { pointer: { x: event.clientX, y: event.clientY }, offset }; }}
      onPointerMove={(event) => { const drag = dragRef.current; if (!drag) return; setOffset(clamp({ x: drag.offset.x + event.clientX - drag.pointer.x, y: drag.offset.y + event.clientY - drag.pointer.y })); }}
      onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
      <div className="relative h-full w-full cursor-move">
        <img ref={imageRef} src={imageUrl} draggable={false} onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none" style={{ width: displaySize.width, height: displaySize.height, transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)` }} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/90 shadow-[inset_0_0_0_999px_rgba(15,23,42,0.10)]" />
      </div>
    </div>
    <div className="mt-5 rounded-2xl border border-rose-100 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>축소</span><span className="font-semibold text-rose-500">{Math.round(zoom * 100)}%</span><span>확대</span></div>
      <input aria-label="사진 확대 비율" className="w-full accent-rose-500" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} />
    </div>
    <div className="mt-auto flex gap-2 pt-4"><button type="button" onClick={reset} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-500"><RotateCcw size={16} /> 초기화</button><button type="button" disabled={applying} onClick={() => void apply()} className="flex-[2] rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-50">{applying ? '적용 중…' : '적용하기'}</button></div>
  </div>;
}
