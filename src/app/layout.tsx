import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Text Summarizer | Built by Joshua Inyang (Bouncey)",
  description:
    "An intelligent text summarization tool powered by OpenAI's GPT-3.5. Built with Next.js and TypeScript.",
  keywords: [
    "AI",
    "text summarizer",
    "OpenAI",
    "GPT-3.5",
    "Next.js",
    "TypeScript",
    "Bouncey",
    "Bouncei",
    "Bouncei Tech",
    "Joshua Inyang",
  ],
  authors: [{ name: "Joshua Inyang" }],
  creator: "Joshua Inyang",
  publisher: "Joshua Inyang",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bouncei.tech",
    title: "AI Text Summarizer | Built by Joshua Inyang (Bouncey)",
    description:
      "An intelligent text summarization tool powered by OpenAI's GPT-3.5. Built with Next.js and TypeScript.",
    siteName: "AI Text Summarizer",
    images: [
      {
        url: "https://bouncei.tech/imgs/logo.png",
        width: 1200,
        height: 630,
        alt: "AI Text Summarizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Text Summarizer | Built by Joshua Inyang",
    description:
      "An intelligent text summarization tool powered by OpenAI's GPT-3.5. Built with Next.js and TypeScript.",
    images: ["https://bouncei.tech/imgs/logo.png"],
    creator: "@InyangJoshua8",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">AI Text Summarizer</h1>
              <div className="text-sm text-gray-600">
                Built by{" "}
                <a
                  href="https://github.com/bouncei"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Bouncey
                </a>
              </div>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
