import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, AlertTriangle } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const getCroppedBlob = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Create a safe area large enough to hold the fully rotated image
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * Math.ceil(Math.sqrt((maxSize / 2) ** 2 * 2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  // Draw the full image centered and rotated
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  // Extract the cropped region from the rotated drawing
  // Map pixelCrop coordinates accounting for the rotation transform
  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
};

export default function AvatarCropModal({ isOpen, onClose, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const onCropChange = useCallback((location) => setCrop(location), []);
  const onZoomChange = useCallback((z) => setZoom(z), []);

  const onCropAreaComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await onCropComplete(file);
      onClose();
    } catch (err) {
      setError('Failed to crop image. Please try again.');
      console.error('Crop error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[16px]"
            style={{
              background: 'rgba(14,14,18,0.96)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-[17px] font-semibold text-[#f5f5f7]">Crop Profile Photo</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X size={16} />
              </button>
            </div>              <div className="px-4 pb-1 pt-2">
              <div className="relative w-full mx-auto h-[100px] sm:h-[140px] md:h-[180px] max-h-[30vh] bg-[#000000] rounded-xl overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={onCropChange}
                  onZoomChange={onZoomChange}
                  onCropComplete={onCropAreaComplete}
                  style={{
                    containerStyle: { background: '#000000' },
                    cropAreaStyle: {
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    },
                  }}
                />
              </div>
            </div>
            <div className="px-5 py-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <ZoomOut size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)', accentColor: '#c8c8d0' }} />
                <ZoomIn size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <div className="flex items-center gap-3">
                <RotateCw size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)', accentColor: '#b0b0bc' }} />
                <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>{rotation}°</span>
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-5 pb-2">
                  <div className="flex items-center gap-2 p-3 rounded-[8px]" style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.12)' }}>
                    <AlertTriangle size={12} className="text-[#ff453a] flex-shrink-0" />
                    <span className="text-[11px] text-[#ff453a] font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-5 py-3 border-t border-[rgba(255,255,255,0.06)]"
              style={{
                background: 'rgba(14,14,18,0.98)',
                backdropFilter: 'blur(12px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              }}
            >
              <button onClick={onClose}
                className="px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f5f5f7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-[8px] text-[12px] font-semibold text-white transition-all flex-shrink-0"
                style={{
                  background: processing ? 'rgba(200,200,208,0.3)' : 'linear-gradient(135deg, #c8c8d0, #dedee4)',
                  boxShadow: '0 4px 16px rgba(200,200,208,0.25)',
                  opacity: processing ? 0.7 : 1,
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                {processing ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Check size={14} />
                )}
                {processing ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
