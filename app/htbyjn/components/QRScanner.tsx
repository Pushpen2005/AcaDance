"use client";
import { useState } from "react";
// You can use 'react-qr-reader' or similar for real QR scanning
// This is a mockup for demo purposes
export default function QRScanner() {
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");

  function handleScan() {
    setScanned(true);
    setCode("QR123456");
    // Here, call attendance API and show toast/feedback
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Live QR Attendance Scanner</h2>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center shadow-lg animate-qr-3d">
          {!scanned ? (
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold shadow hover:bg-green-700 transition-colors duration-200"
              onClick={handleScan}
              aria-label="Scan QR Code"
            >
              Scan QR
            </button>
          ) : (
            <span className="text-green-700 font-bold text-xl">Scanned: {code}</span>
          )}
        </div>
        <p className="text-gray-500">(Demo: Replace with real QR scanner for production)</p>
      </div>
      <style jsx>{`
        .animate-qr-3d {
          animation: qr3d 1.2s cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes qr3d {
          0% { transform: scale(0.9) rotateY(-10deg); }
          50% { transform: scale(1.05) rotateY(10deg); }
          100% { transform: scale(1) rotateY(0deg); }
        }
      `}</style>
    </div>
  );
}
