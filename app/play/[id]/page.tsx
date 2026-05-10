"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Webcam from "react-webcam";
import songsData from "@/app/data/songs.json";
// Pastikan kamu mengoper isSmartMode ke dalam hook ini (penjelasan di bawah)
import { useFaceScroll } from "@/app/hooks/useFaceScroll";

// Fungsi cari lagu
function getSongById(id: string) {
  return songsData.find((song) => song.id === id);
}

// Fungsi parser lirik & chord
function parseContent(content: string) {
  const lines = content.split('\n');
  return lines.map(line => {
    const chordRegex = /\[(.*?)\]/g;
    let chords = [];
    let match;
    while ((match = chordRegex.exec(line)) !== null) {
      chords.push(match[1]);
    }
    const lyric = line.replace(/\[(.*?)\]/g, '').trim();
    return { chords, lyric };
  });
}

export default function PlayModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const song = getSongById(id);

  // --- STATE & REFS UNTUK AI & KAMERA ---
  const webcamRef = useRef<Webcam>(null);
  const [sensitivity, setSensitivity] = useState(45);
  
  // --- STATE BARU: UNTUK MODE HYBRID & AUTO-SCROLL WAKTU ---
  const [isSmartMode, setIsSmartMode] = useState(true); // true = AI Wajah, false = Timer Santai
  const [isAutoScrolling, setIsAutoScrolling] = useState(false); // Play/Pause scroll waktu
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(2); // Kecepatan 1-10
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hook AI Wajah (Disarankan menambahkan argumen isSmartMode ke dalam hook ini)
  const { isAiLoaded, calibrateNeutralPosition, isCalibrated } = useFaceScroll(webcamRef, sensitivity, isSmartMode);

  // --- EFEK LOGIKA MESIN SCROLL WAKTU (MODE SANTAI) ---
  useEffect(() => {
    // Sesuaikan ID ini dengan halaman masing-masing
    // Pakai 'lyrics-container' untuk PLAY 1, 'lyrics-container-pasted' untuk PLAY 2
    const container = document.getElementById('lyrics-container'); 
    let animationFrameId: number;

    const performScroll = () => {
      if (container) {
        // Karena requestAnimationFrame berjalan 60x per detik (sangat cepat),
        // kecepatan scroll (autoScrollSpeed) kita bagi kecil agar tetap santai
        container.scrollBy({ top: autoScrollSpeed / 5, left: 0, behavior: 'auto' });
      }
      animationFrameId = requestAnimationFrame(performScroll);
    };

    if (!isSmartMode && isAutoScrolling && container) {
      animationFrameId = requestAnimationFrame(performScroll);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSmartMode, isAutoScrolling, autoScrollSpeed]);

  if (!song) {
    return notFound();
  }

  const parsedContent = parseContent(song.content);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark select-none overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-background-dark/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg transition-colors border border-red-600/30">
            <span className="material-symbols-outlined text-[20px] fill-1">stop</span>
            <span className="font-bold text-sm tracking-wide uppercase">Stop</span>
          </Link>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">Now Playing</span>
          <h2 className="text-slate-100 text-lg font-bold leading-tight">{song.title} — {song.artist}</h2>
        </div>

        {/* Thumbnail Kamera WebCam Mini */}
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-14 rounded-md overflow-hidden border-2 border-primary/40 bg-black shadow-[0_0_10px_rgba(219,242,13,0.2)]">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              className={`absolute inset-0 w-full h-full object-cover ${!isSmartMode ? 'opacity-30 grayscale' : ''}`}
            />
            {!isAiLoaded && isSmartMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-primary font-bold animate-pulse">
                AI LOADING
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Lyrics & Chords */}
      <main className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center gap-12 max-w-4xl mx-auto w-full relative" id="lyrics-container">
        
        {/* OVERLAY KALIBRASI SEBELUM MULAI SCROLL (HANYA MUNCUL DI MODE AI) */}
        {isSmartMode && !isCalibrated && isAiLoaded && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background-dark/90 backdrop-blur-sm">
             <div className="bg-slate-900 border border-primary/20 p-8 rounded-2xl text-center max-w-md shadow-2xl">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">face</span>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">Tatap Lurus ke Layar</h3>
                <p className="text-slate-400 mb-8">Posisikan wajahmu senyaman mungkin saat bermain gitar, lalu klik tombol di bawah untuk mengunci posisi netral.</p>
                <button 
                  onClick={calibrateNeutralPosition}
                  className="w-full bg-primary hover:bg-[#c4d90c] text-background-dark font-bold py-4 rounded-xl text-lg transition-all transform active:scale-95"
                >
                  KUNCI POSISI & MULAI MAIN
                </button>
             </div>
           </div>
        )}

        <div className="w-full space-y-12">
          {parsedContent.map((line, index) => (
            (line.lyric || line.chords.length > 0) && (
              <div key={index} className="flex flex-col items-center text-center">
                {line.chords.length > 0 && (
                  <div className="flex gap-16 mb-2">
                    {line.chords.map((chord, cIndex) => (
                      <span key={cIndex} className="text-primary font-bold text-xl lg:text-2xl tracking-wider">[{chord}]</span>
                    ))}
                  </div>
                )}
                {line.lyric && (
                  <h1 className="text-slate-100 text-3xl lg:text-4xl font-bold leading-tight">{line.lyric}</h1>
                )}
              </div>
            )
          ))}
        </div>
        
        <div className="h-[70vh]"></div>
      </main>

      {/* Bottom Bar: Kontrol Hybrid (Sensitivity & Kecepatan) */}
      <footer className="px-8 py-6 border-t border-primary/10 bg-background-dark/95 backdrop-blur-md shrink-0 z-10">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6">
          
          {/* Tombol Toggle Mode */}
          <button 
            onClick={() => { setIsSmartMode(!isSmartMode); setIsAutoScrolling(false); }}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-colors border ${isSmartMode ? 'bg-primary/20 text-primary border-primary/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
          >
            <span className="material-symbols-outlined">{isSmartMode ? 'psychology' : 'timer'}</span>
            {isSmartMode ? 'Mode AI Wajah' : 'Mode Santai'}
          </button>

          {/* Tombol Play/Pause Khusus Mode Santai */}
          {!isSmartMode && (
            <button 
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all transform active:scale-95 shadow-lg ${isAutoScrolling ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50'}`}
            >
              <span className="material-symbols-outlined">{isAutoScrolling ? 'pause' : 'play_arrow'}</span>
              {isAutoScrolling ? 'Pause Scroll' : 'Play Scroll'}
            </button>
          )}

          {/* Slider Dinamis */}
          <div className="flex-1 w-full flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-full bg-slate-800 text-slate-400">
              <span className="material-symbols-outlined">{isSmartMode ? 'accessibility_new' : 'speed'}</span>
            </div>
            <input 
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80" 
              type="range" 
              min="1" 
              max={isSmartMode ? "100" : "10"} 
              value={isSmartMode ? sensitivity : autoScrollSpeed}
              onChange={(e) => isSmartMode ? setSensitivity(Number(e.target.value)) : setAutoScrollSpeed(Number(e.target.value))}
            />
          </div>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {isSmartMode ? `Sensitivitas Wajah (${sensitivity}%)` : `Kecepatan Scroll Otomatis (${autoScrollSpeed})`}
          </p>
        </div>
      </footer>

      {/* Edge UI Overlays */}
      <div className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-1 opacity-30 pointer-events-none z-0">
        <div className="w-1 h-8 bg-primary rounded-full"></div>
        <div className="w-1 h-12 bg-primary rounded-full"></div>
        <div className="w-1 h-8 bg-primary rounded-full"></div>
      </div>
      <div className="fixed top-1/2 right-4 -translate-y-1/2 flex flex-col gap-1 opacity-30 rotate-180 pointer-events-none z-0">
        <div className="w-1 h-8 bg-primary rounded-full"></div>
        <div className="w-1 h-12 bg-primary rounded-full"></div>
        <div className="w-1 h-8 bg-primary rounded-full"></div>
      </div>
    </div>
  );
}