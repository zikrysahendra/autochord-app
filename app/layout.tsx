import "./globals.css";

export const metadata = {
  title: "AutoChord - Main Gitar Tanpa Putus",
  description: "Aplikasi auto-scroll chord gitar menggunakan pergerakan wajah.",
  icons: {
    icon: '/icon.svg', 
    shortcut: '/icon.ico',
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display">
        {children}
      </body>
    </html>
  );
}