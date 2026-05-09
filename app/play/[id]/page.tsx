"use client"; // Wajib karena kita pakai hooks, kamera, dan event listener

import React, { useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Webcam from "react-webcam";
import songsData from "@/app/data/songs.json";
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
  // Di Next.js versi terbaru, params di Client Component harus di-unwrap pakai React.use()
  const { id } = React.use(params);
  const song = getSongById(id);

  // --- STATE & REFS UNTUK AI & KAMERA ---
  const webcamRef = useRef<Webcam>(null);
  const [sensitivity, setSensitivity] = useState(45);
  
  // Panggil Custom Hook AI kita!
  const { isAiLoaded, calibrateNeutralPosition, isCalibrated } = useFaceScroll(webcamRef, sensitivity);

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
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!isAiLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-primary font-bold animate-pulse">
                AI LOADING
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Lyrics & Chords */}
      <main className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center gap-12 max-w-4xl mx-auto w-full relative" id="lyrics-container">
        
        {/* OVERLAY KALIBRASI SEBELUM MULAI SCROLL */}
        {!isCalibrated && isAiLoaded && (
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

      {/* Bottom Bar: Sensitivity Control */}
      <footer className="px-8 py-6 border-t border-primary/10 bg-background-dark/95 backdrop-blur-md shrink-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-6">
          <div className="flex items-center justify-center size-10 rounded-full bg-slate-800 text-slate-400">
            <span className="material-symbols-outlined">accessibility_new</span>
          </div>
          <div className="flex-1 group relative flex items-center">
            <input 
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80" 
              max="100" 
              min="1" 
              type="range" 
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-center size-10 rounded-full bg-slate-800 text-slate-400">
            <span className="material-symbols-outlined">speed</span>
          </div>
        </div>
        <div className="text-center mt-3">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sensitivitas Wajah ({sensitivity}%)</p>
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