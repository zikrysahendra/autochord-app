"use client"; // Wajib ada karena kita menggunakan Hook (useState & useRouter)

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 1. Import data JSON yang baru saja kita buat
import songsData from './data/songs.json'; 

// --- FUNGSI AJAIB FORMATTER (Ditaruh di luar agar tidak dirender ulang terus) ---
const formatUltimateGuitar = (rawText: string) => {
  const lines = rawText.split('\n');
  let result: string[] = [];
  let i = 0;

  const isChordWord = (word: string) => {
    const chordRegex = /^([A-G][#b]?(m|min|maj|dim|aug|sus|add)?\d*(\/[A-G][#b]?)?|\(?\d?x\)?|N\.C\.|~|-)$/i;
    return chordRegex.test(word);
  };

  const isChordLine = (line: string) => {
    if (line.trim() === '') return false;
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) return false;
    const words = line.trim().split(/\s+/);
    return words.every(isChordWord);
  };

  while (i < lines.length) {
    let line = lines[i].replace(/\r$/, '');

    if (line.trim().match(/^\[.*\]$/)) {
      result.push(line.trim().replace(/^\[(.*)\]$/, '$1:'));
      i++;
      continue;
    }

    if (isChordLine(line)) {
      const nextLine = (i + 1 < lines.length) ? lines[i + 1].replace(/\r$/, '') : null;
      const chords: { word: string, index: number }[] = [];
      const regex = /\S+/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        chords.push({ word: match[0], index: match.index });
      }

      if (nextLine !== null && nextLine.trim() !== '' && !isChordLine(nextLine) && !nextLine.trim().match(/^\[.*\]$/)) {
        let mergedLine = nextLine;
        for (let j = chords.length - 1; j >= 0; j--) {
          const { word, index } = chords[j];
          if (index >= mergedLine.length) {
            mergedLine = mergedLine.padEnd(index, ' ') + `[${word}]`;
          } else {
            mergedLine = mergedLine.slice(0, index) + `[${word}]` + mergedLine.slice(index);
          }
        }
        result.push(mergedLine.trimEnd());
        i += 2; 
        continue;
      } else {
        let chordLineBrackets = chords.map(c => `[${c.word}]`).join(' ');
        result.push(chordLineBrackets);
        i++;
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
};
// -------------------------------------------------------------------------------

export default function Home() {
  const [pastedContent, setPastedContent] = useState("");
  const router = useRouter();

  const handleStartPastedGame = () => {
    if (!pastedContent.trim()) {
      alert("Tempelkan dulu lirik dan chord-mu!");
      return;
    }
    
    localStorage.setItem('scrolled_pasted_content', pastedContent);
    router.push('/calibrate?source=paste');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        
        {/* HEADER */}
<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 py-4 lg:px-20">

  <div className="flex items-center gap-3">
    <img 
      src="/autochord_icon.svg" 
      alt="AutoChord Logo" 
      className="h-40 w-auto object-contain" 
    />
  </div>

  <div className="hidden md:flex flex-1 justify-center max-w-lg mx-8"> 
    <div className="flex w-full items-stretch rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"> {/* rounded-lg jadi rounded-xl */}
      <div className="flex items-center justify-center pl-4 text-slate-500">
        <span className="material-symbols-outlined text-xl">search</span> 
      </div>
      <input 
        className="w-full bg-transparent border-none focus:ring-0 outline-none text-base py-3 px-4 placeholder:text-slate-500" /* text-sm jadi text-base, py-2 jadi py-3 */
        placeholder="Cari lagu atau artis..." 
        type="text"
      />
    </div>
  </div>

  <div className="flex items-center gap-4">
    <button className="flex items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-slate-300"> {/* p-2 jadi p-3, tambah efek hover & transition */}
      <span className="material-symbols-outlined text-2xl">notifications</span> {/* Tambah text-2xl pada ikon */}
    </button>
  </div>
</header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col lg:flex-row gap-8 px-6 py-8 lg:px-20 max-w-7xl mx-auto w-full">
          
          {/* SIDEBAR */}
          <aside className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
            <nav className="flex flex-col gap-1">
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-background-dark font-bold" href="#">
                <span className="material-symbols-outlined">home</span>
                <span>Home</span>
              </a>
            </nav>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col gap-10">
            
            {/* HERO BANNER */}
            <section className="flex flex-col gap-4">
              <div className="p-8 rounded-3xl bg-linear-to-br from-primary/20 to-transparent border border-primary/10">
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-2">
                  Main Gitar Tanpa Putus,<br />
                  <span className="text-primary">Scroll Pakai Wajahmu.</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Face-tracking otomatis menggeser chord saat Anda bermain.</p>
              </div>
            </section>

            {/* POPULAR SONGS */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Pilihan Lagu Populer</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {songsData.map((song) => (
                  <Link href={`/play/${song.id}`} key={song.id}>
                    <div className="group flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-primary/50 transition-all cursor-pointer h-full">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          <span className="material-symbols-outlined text-slate-400">{song.coverIcon}</span>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold">{song.title}</h3>
                          <p className="text-sm text-slate-500">{song.artist}</p>
                        </div>
                      </div>
                      <button className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-primary group-hover:text-background-dark flex items-center justify-center transition-all shrink-0">
                        <span className="material-symbols-outlined fill-1">play_arrow</span>
                      </button>
                    </div>
                  </Link>
                ))}

              </div>
            </section>

            {/* CUSTOM CHORD INPUT */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Punya Chord Sendiri?</h2>
                <p className="text-slate-500">Tempelkan lirik dan chord favoritmu di sini untuk mulai bermain.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="relative group">
                  <textarea 
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    className="w-full min-h-75 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 font-mono text-sm focus:border-primary outline-none transition-colors placeholder:text-slate-500" 
                    placeholder={`Paste chord dan lirik di sini...\n\nC                  Em\nI took the supermarket flowers...`}
                  ></textarea>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          setPastedContent(text);
                        } catch (err) {
                          console.error('Gagal mengambil teks:', err);
                        }
                      }}
                      className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">content_paste</span> Tempel
                    </button>
                  </div>
                </div>

                {/* --- TOMBOL MAGIC FORMATTER BARU --- */}
                <button 
                  onClick={() => {
                    if (!pastedContent.trim()) {
                      alert("Pastiin kamu udah paste lirik dulu ya!");
                      return;
                    }
                    // Panggil sihirnya dan ubah isi textareanya!
                    const formattedText = formatUltimateGuitar(pastedContent);
                    setPastedContent(formattedText);
                  }}
                  className="w-full bg-indigo-500/20 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  Rapikan Format 
                </button>

                {/* BUTTON UNTUK MULAI */}
                <button 
                  onClick={handleStartPastedGame}
                  className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
                >
                  <span className="material-symbols-outlined font-bold">rocket_launch</span>
                  Mulai Bermain dengan Paste
                </button>
              </div>
            </section>
            
            {/* FOOTER */}
            <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
              <p>© 2026 ScrollFACE. All rights reserved.</p>
              <div className="flex justify-center gap-6 mt-4">
                <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:text-primary transition-colors" href="#">Terms</a>
                <a className="hover:text-primary transition-colors" href="#">Feedback</a>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}