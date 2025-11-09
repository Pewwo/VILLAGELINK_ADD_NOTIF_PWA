import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ImageModal = ({ isOpen, imageUrl, altText, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close image"
        >
          <FaTimes size={24} />
        </button>
        
        <div className="relative">
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
