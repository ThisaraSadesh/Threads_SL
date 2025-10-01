import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

import "../globals.css";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";
import RightSidebar from "@/components/shared/RightSidebar";
import Topbar from "@/components/shared/Topbar";
import AblyClientProvider from "@/app/providers/AblyClientProvider";
import { Toaster } from "sonner";
const inter = Inter({ subsets: ["latin"] });
import { TooltipProvider } from "@radix-ui/react-tooltip";

export const metadata: Metadata = {
  title: "Threads",
  description: "A Next.js 13 Meta Threads application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en">
        <body className={inter.className}>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <AblyClientProvider>
            <TooltipProvider>
              <Topbar />

              <main className="flex flex-row">
                <LeftSidebar />
                <section className="main-container">
                  <Toaster />

                  <div className="w-full max-w-4xl">{children}</div>
                </section>
                {/* @ts-ignore */}
                <RightSidebar />
              </main>

              <Bottombar />
            </TooltipProvider>
          </AblyClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
