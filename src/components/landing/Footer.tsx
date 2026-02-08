import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

const footerLinks = {
    product: [
        { label: "Find Tutors", href: "/browse" },
        { label: "Become a Tutor", href: "/register?role=teacher" },
        { label: "Pricing", href: "/#pricing" },
        { label: "How It Works", href: "/#how-it-works" },
    ],
    company: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "FAQ", href: "/faq" },
    ],
    support: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "Community", href: "/community" },
    ],
    legal: [
        { label: "Terms of Service", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Cookie Policy", href: "/cookies" },
    ],
};

const socialLinks = [
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export function Footer() {
    return (
        <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center mb-6">
                            <div className="relative w-[50rem] h-[12.5rem]">
                                <Image
                                    src="/cropped.png"
                                    alt="Tutorly Logo"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50rem"
                                    className="object-contain"
                                />
                            </div>
                        </Link>
                        <p className="text-sm mb-6 max-w-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                            Connecting learners with world-class tutors for personalized online education.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-900 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white hover:text-slate-900 dark:hover:text-black transition-all duration-300 border border-slate-200 dark:border-slate-800"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Support</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm">
                        © {new Date().getFullYear()} Tutorly. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <span>🌍 Available worldwide</span>
                        <span>🔒 Secure payments</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
