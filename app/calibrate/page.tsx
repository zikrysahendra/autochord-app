"use client";

import React, { useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Webcam from "react-webcam";
import { useFaceScroll } from "../hooks/useFaceScroll"; 

// Kita pisahkan konten utamanya ke dalam komponen ini agar bisa dibungkus Suspense
function CalibrateContent() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Membaca apakah user datang dari tombol "Paste" di halaman depan
  const isFromPaste = searchParams.get('source') === 'paste';
  
  // Panggil hook AI Face Scroll
  const { isAiLoaded, calibrateNeutralPosition } = useFaceScroll(webcamRef, 50);

  const handleCalibrateAndContinue = () => {
    // 1. Simpan titik netral wajah saat ini
    calibrateNeutralPosition(); 

    // 2. Arahkan user ke halaman yang tepat
    if (isFromPaste) {
      console.log("Kalibrasi paste sukses. Menuju halaman play-pasted...");
      router.push('/play-pasted'); 
    } else {
      console.log("Kalibrasi reguler sukses. Kembali...");
      router.back(); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-slate-100 px-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8 text-center">
        
        {/* JUDUL DAN INSTRUKSI */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center size-16 bg-primary/20 text-primary rounded-full mx-auto mb-2">
            <span className="material-symbols-outlined text-3xl">center_focus_strong</span>
          </div>
          <h1 className="text-3xl font-bold">Kalibrasi Wajah</h1>
          <p className="text-slate-400">Pastikan wajah Anda terlihat di kamera, tatap layar dengan posisi santai, lalu tekan tombol.</p>
        </div>

        {/* AREA WEBCAM */}
        <div className="relative w-full aspect-video bg-slate-800 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/10">
          <Webcam 
            ref={webcamRef} 
            audio={false} 
            mirrored={true} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Tampilkan loading jika AI belum siap */}
          {!isAiLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <p className="animate-pulse font-medium text-primary flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin">sync</span>
                Memuat AI Model...
              </p>
            </div>
          )}
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={handleCalibrateAndContinue}
            disabled={!isAiLoaded}
            className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined font-bold">face</span>
            SETEL POSISI NETRAL
          </button>
          
          <button 
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
          >
            Batal & Kembali
          </button>
        </div>

      </div>
    </div>
  );
}

// Komponen Utama yang diexport
export default function CalibratePage() {
  return (
    // Suspense wajib ada di Next.js App Router jika kita memakai useSearchParams
    <Suspense fallback={<div className="min-h-screen bg-background-dark flex items-center justify-center text-primary font-bold">Memuat Halaman...</div>}>
      <CalibrateContent />
    </Suspense>
  );
}