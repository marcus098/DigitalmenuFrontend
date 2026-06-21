import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ManageCookiesLink from '../Components/CookieConsent/ManageCookiesLink';

type Props = {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
};

const LegalLayout: React.FC<Props> = ({ title, lastUpdated, children }) => {
    useEffect(() => {
        document.title = `${title} · RestaurantFlow`;
        window.scrollTo(0, 0);
    }, [title]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
                    <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-orange-600">
                        ← RestaurantFlow
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 print:hidden"
                    >
                        Stampa
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                <p className="mt-2 text-sm text-slate-500">Ultimo aggiornamento: {lastUpdated}</p>

                <div className="legal-content mt-8 text-[15px] leading-relaxed text-slate-700">
                    {children}
                </div>

                <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <Link to="/privacy" className="hover:text-orange-600">Privacy policy</Link>
                        <Link to="/cookie-policy" className="hover:text-orange-600">Cookie policy</Link>
                        <ManageCookiesLink className="hover:text-orange-600">Gestisci cookie</ManageCookiesLink>
                        <Link to="/" className="hover:text-orange-600">Home</Link>
                    </div>
                </footer>
            </main>

            <style>{`
                .legal-content h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 2rem; margin-bottom: 0.75rem; }
                .legal-content h3 { font-size: 1.05rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                .legal-content p { margin-bottom: 0.875rem; }
                .legal-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.875rem; }
                .legal-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.875rem; }
                .legal-content li { margin-bottom: 0.375rem; }
                .legal-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
                .legal-content th, .legal-content td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
                .legal-content th { background: #f8fafc; font-weight: 600; }
                .legal-content a { color: #ea580c; text-decoration: underline; text-underline-offset: 2px; }
                .legal-content strong { color: #0f172a; }
                .legal-content .placeholder { background: #fef3c7; padding: 0 0.25rem; border-radius: 0.25rem; color: #92400e; font-weight: 600; }
            `}</style>
        </div>
    );
};

export default LegalLayout;
