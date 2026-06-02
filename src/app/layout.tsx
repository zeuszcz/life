import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life — игра про тебя",
  description:
    "Преврати свою жизнь в игру: ставь цели, получай роадмапу от ИИ, прокачивай персонажа и достигай реальных результатов.",
};

export const viewport: Viewport = {
  themeColor: "#0d1320",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
