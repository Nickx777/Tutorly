import { Navbar, Footer } from "@/components/landing";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />
            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </main>
            <Footer />
        </div>
    );
}
