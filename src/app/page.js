import { getServerSession } from "next-auth"
import { authOptions } from "../services/auth"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/face-swap')
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome to Face Swap App</h1>
          <a
            href="/auth/signin"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
          >
            Login / Sign Up
          </a>
        </div>
      </main>
    </div>
  )
}
