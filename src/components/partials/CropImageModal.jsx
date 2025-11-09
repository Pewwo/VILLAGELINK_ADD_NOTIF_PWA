import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FaTimes } from 'react-icons/fa';

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });
}

function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise(async (resolve, reject) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = 'cropped.jpeg';
      const fileUrl = window.URL.createObjectURL(blob);
      resolve({ blob, fileUrl });
    }, 'image/jpeg');
  });
}

const CropImageModal = ({ isOpen, imageSrc, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      const { blob, fileUrl } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob, fileUrl);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center p-6">
      <div className="relative w-full max-w-lg h-auto bg-white rounded-xl shadow-xl p-8 flex flex-col select-none pointer-events-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Crop Image</h2>
        <div className="flex-grow rounded-lg overflow-hidden border border-gray-300 relative" style={{ minHeight: '320px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>
        <div className="mt-6 flex flex-col space-y-4">
          {/* Removed Zoom slider as per user request */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleConfirm}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition"
              style={{ marginTop: '0' }}
            >
              Confirm
            </button>
            <button
              onClick={onCancel}
              className="w-full px-6 py-2 border border-gray-500 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropImageModal;
