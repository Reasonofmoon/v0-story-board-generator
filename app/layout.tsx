import type React from "react"
import { StoryboardProvider } from "@/context/storyboard-context"
import DevTools from "@/components/dev-tools"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoryboardProvider>
          {children}
          {process.env.NODE_ENV !== "production" && <DevTools />}
        </StoryboardProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
