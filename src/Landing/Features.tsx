import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
    Bike, CalendarCheck, CreditCard, Globe, HeartHandshake, Printer, QrCode, Smartphone, Sparkles,
    type LucideIcon,
} from 'lucide-react';
import { MENU_TEMPLATES } from '../Client/menuTemplates';

type Feat = { icon: LucideIcon; title: string; text: string; chips?: string[]; className?: string; dark?: boolean; href?: string };

const FEATS: Feat[] = [
    {
        icon: Smartphone, title: 'Omnivo Sala',
        text: 'L’app dei camerieri: ordini presi al tavolo, notifiche quando un piatto è pronto, mappa dei tavoli.',
        chips: ['Notifiche push', 'Mappa sala'],
    },
    {
        icon: Printer, title: 'Cucina e stampanti',
        text: 'Le comande si stampano da sole, ogni reparto riceve solo i suoi piatti.',
        chips: ['CloudPRNT', 'ESC/POS', 'RawBT'],
    },
    {
        icon: CreditCard, title: 'Cassa e pagamenti',
        text: 'Conto per tavolo, sconti, pagamento dal telefono o contactless sul tuo Stripe o SumUp.',
        chips: ['0% a noi'],
    },
    {
        icon: CalendarCheck, title: 'Prenotazioni',
        text: 'Online dalla pagina del locale o inserite dallo staff. Conferme e no-show in un calendario.',
    },
    {
        icon: Bike, title: 'Asporto e consegne',
        text: 'Fasce orarie con capienza, pausa quando la cucina è piena, giorni di chiusura.',
    },
    {
        icon: HeartHandshake, title: 'Tessere fedeltà',
        text: 'Punti caricati alla chiusura del conto, tessera con QR inviata per email.',
    },
    {
        icon: Globe, title: 'Sito del locale',
        text: `Un builder con ${MENU_TEMPLATES.length} template: menu, orari, prenotazioni e asporto già collegati.`,
    },
    {
        icon: Sparkles, title: 'AxiomAI', dark: true, href: '#axiomai',
        text: 'Riepiloghi ogni mattina, consigli sul menu e descrizioni dei piatti scritte per te.',
    },
];

/** Schermino e-ink con un QR che cambia ogni pochi secondi (fermo con reduced-motion). */
const EinkQr: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.6 });
    const reduce = useReducedMotion();
    const [n, setN] = useState(0);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (!inView || reduce) return;
        const t = window.setInterval(() => {
            setFlash(true);
            window.setTimeout(() => { setN(x => x + 1); setFlash(false); }, 220);
        }, 3200);
        return () => window.clearInterval(t);
    }, [inView, reduce]);

    const token = ['k7Qa2', 'Xm91c', 'p3TzR', 'w8LeN', 'Hd25v'][n % 5];
    return (
        <div ref={ref} className="eink" role="img" aria-label="Schermino e-ink sul tavolo 7 con un QR che cambia a ogni cliente">
            <div className="eink-screen">
                <div className="w-full" style={{ opacity: flash ? 0.15 : 1, transition: 'opacity .2s steps(2)' }}>
                    <QRCode value={`OMNIVO-TAVOLO-7-${token}`} size={256} style={{ width: '100%', height: 'auto', display: 'block' }} bgColor="#E9E7E1" fgColor="#1d1d1b" level="L" />
                </div>
                <div className="flex w-full items-baseline justify-between text-[11px] font-bold tracking-[0.04em]">
                    <span>TAVOLO 7</span><span className="tnum opacity-70">#{token}</span>
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ f: Feat }> = ({ f }) => {
    const Icon = f.icon;
    const body = (
        <>
            <div className="flex items-start gap-4 sm:block">
                <span className="feat-ic"><Icon size={22} strokeWidth={2.1} aria-hidden="true" /></span>
                <div className="sm:mt-4">
                    <h3 className="feat-t">{f.title}</h3>
                    <p className="feat-d mt-1.5">{f.text}</p>
                    {f.chips && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {f.chips.map(c => <span key={c} className="chip">{c}</span>)}
                        </div>
                    )}
                    {f.href && <span className="mt-3 inline-block text-[14px] font-bold text-[var(--orange)]">Scopri AxiomAI ↓</span>}
                </div>
            </div>
        </>
    );
    const cls = `feat ${f.dark ? 'is-dark' : ''} ${f.className ?? ''}`;
    return f.href
        ? <a href={f.href} className={`${cls} block`}>{body}</a>
        : <div className={cls}>{body}</div>;
};

const Features: React.FC = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* Card grande: QR dinamico + menu digitale */}
        <div className="feat feat-hero sm:col-span-2 lg:row-span-2 grid gap-6 overflow-hidden sm:grid-cols-[1fr_auto] lg:p-7">
            <div className="flex flex-col h-full">
                <span className="feat-ic"><QrCode size={22} strokeWidth={2.1} aria-hidden="true" /></span>
                <h3 className="feat-t mt-4 text-[24px] sm:text-[26px]">QR dinamico e menu digitale</h3>
                <p className="feat-d mt-2 max-w-[360px] text-[15.5px]">
                    Sul tavolo c’è uno schermino e-ink con un QR che cambia a ogni cliente: ordina solo chi è
                    seduto lì. Il menu si apre nel browser, senza app da scaricare.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-auto sm:pt-5">
                    {['Allergeni', 'Più lingue', 'Esauriti in tempo reale', 'Ordine di gruppo', 'Aggiunte e note'].map(c => (
                        <span key={c} className="chip">{c}</span>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end sm:pr-2 lg:pr-4">
                <EinkQr />
            </div>
        </div>
        {FEATS.map(f => <FeatureCard key={f.title} f={f} />)}
    </div>
);

export default Features;
