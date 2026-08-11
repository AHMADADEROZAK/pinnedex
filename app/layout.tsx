import { Geist_Mono, Inter, Oxanium } from "next/font/google"
import { headers } from "next/headers"

import "./globals.css"
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/features/theme";
import { SolanaProvider, solanaRpcClientPath } from "@/features/solana";
import { RouteTransitionProvider } from "@/features/app-shell/components/RouteTransitionProvider";
import { Toaster } from "@/components/ui/toast";

const oxaniumHeading = Oxanium({ subsets: ['latin'], variable: '--font-heading' });

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const endpoint = `${proto}://${host}${solanaRpcClientPath}`

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, oxaniumHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <SolanaProvider endpoint={endpoint}>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
          </SolanaProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
