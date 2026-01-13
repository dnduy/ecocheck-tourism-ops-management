
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning after success to prevent multiple triggers
        scanner.clear().then(() => {
          onScanSuccess(decodedText);
        }).catch(err => console.error("Failed to clear scanner", err));
      },
      (_errorMessage) => {
        // parse error, ignore it.
      }
    );

    scannerRef.current = scanner;

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner during cleanup", error);
        });
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Quét mã QR Tài sản</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 bg-black">
          <div id="reader" className="w-full overflow-hidden rounded-xl bg-white"></div>
        </div>

        <div className="p-4 bg-white text-center">
          <p className="text-xs text-gray-500">Di chuyển camera đến mã QR dán trên thiết bị hoặc khu vực để mở nhanh Checklist.</p>
        </div>
      </div>
    </div>
  );
};
