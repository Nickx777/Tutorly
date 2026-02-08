import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl text-center space-y-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Page Not Found</h1>
        <p className="text-slate-400 text-lg">The page you are looking for does not exist.</p>

        <div className="relative mx-auto w-full max-w-4xl aspect-[3/2]">
          <Image
            src="/404-owl.png"
            alt="Tutorly 404 Owl"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-slate-900 font-semibold hover:bg-slate-200 transition-colors"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
