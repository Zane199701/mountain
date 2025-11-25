import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with heavy blur */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Content with Glass Effect */}
      <div className={`
        relative bg-white/80 backdrop-blur-2xl border border-white/40 
        rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col 
        transform transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/50">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;