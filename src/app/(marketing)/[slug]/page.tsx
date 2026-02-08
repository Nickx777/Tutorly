import { notFound } from "next/navigation";

const ALLOWED_SLUGS = [
    "about",
    "careers",
    "blog",
    "faq",
    "help",
    "contact",
    "community",
    "terms",
    "privacy",
    "cookies",
] as const;

export function generateStaticParams() {
    return ALLOWED_SLUGS.map((slug) => ({ slug }));
}

export default async function MarketingPage({
    params,
}: {
    params: Promise<{ slug?: string }>;
}) {
    const { slug } = await params;

    if (!slug || !ALLOWED_SLUGS.includes(slug as (typeof ALLOWED_SLUGS)[number])) {
        notFound();
    }

    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent pb-2">
                {title}
            </h1>
            <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                <p>
                    This is a placeholder page for <strong>{title}</strong>. In a production application,
                    this content would be managed via a CMS or Markdown files.
                </p>
                <p>
                    Tutorly is committed to providing the best learning experience.
                    {slug === "terms" && " By using our services, you agree to our terms."}
                    {slug === "privacy" && " We value your privacy and data security."}
                </p>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 mt-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Coming Soon</h3>
                    <p className="text-slate-400">
                        We are currently updating our {title.toLowerCase()} documentation.
                        Please check back later for full details.
                    </p>
                </div>
            </div>
        </div>
    );
}
