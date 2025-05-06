import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata = {
  title: "Image Generator Dashboard",
  description: "Image Generator App, AI Image Generator, Checkout Payment, CMS",
};

export default async function RootLayout({ children }) {
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
        <main className="flex-grow px-4 py-8 mx-auto max-w-7xl w-full">
          {children}
        </main>
        {!isHomePage && <Footer />}
      </body>
    </html>
  );
}

export function RootLayout1({ children }) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-grow px-4 py-8 mx-auto max-w-7xl w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
