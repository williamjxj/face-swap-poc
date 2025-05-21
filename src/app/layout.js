import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Footer from '@/components/Footer'
import ConditionalHeader from '@/components/ConditionalHeader'
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Custom Face Swap - AI Face Swap",
  description: "AI Face Swap Tool, Checkout Payment, CMS",
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider session={session}>
          {/* Client-side header component that checks for auth pages */}
          <ConditionalHeader />
          <main className={inter.className}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
