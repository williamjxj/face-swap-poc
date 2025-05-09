import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getServerSession } from "next-auth";
import { authOptions } from "../services/auth";

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
  title: "SeaArt.AI - AI Face Swap",
  description: "AI Face Swap Tool, Checkout Payment, CMS",
}

export async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  const segment = children.props.childProp?.segment;
  const isAuthPage = segment === 'auth';
  const isHomePage = segment === undefined || segment === '';

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {!isAuthPage && !isHomePage && session && <Header />}
        <main className={inter.className}>
          {children}
        </main>
        {!isHomePage && <Footer />}
      </body>
    </html>
  );
}

export default async function RootLayout1({ children }) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-grow px-2 py-2 mx-auto max-w-7xl w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
