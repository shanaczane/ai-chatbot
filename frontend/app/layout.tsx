import type { Metadata } from 'next';
import { Press_Start_2P, VT323, Nunito } from 'next/font/google';
import './globals.css';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
});

const nunito = Nunito({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'AI_CHATBOT.exe',
  description: 'AI Chatbot with escalation logic — Portfolio Project',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${vt323.variable} ${nunito.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
