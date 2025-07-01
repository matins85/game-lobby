import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConfigProvider } from "antd";
import "./globals.css";
import "antd/dist/reset.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Lobby - Number Guessing Challenge",
  description:
    "Join the ultimate number guessing game lobby. Pick your lucky number and compete with other players!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#000000",
              borderRadius: 9,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
