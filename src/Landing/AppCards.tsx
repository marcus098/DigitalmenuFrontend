import React, { useEffect, useState } from 'react';
import { BellRing, ChefHat, CreditCard, QrCode, Sparkles, type LucideIcon } from 'lucide-react';
import { AI_NAME } from './brand';

/*
 * "Schede app": le notifiche/card di Omnivo che appaiono sopra le foto e i video.
 * Sono componenti HTML veri (testo selezionabile, leggibile dagli screen reader).
 */

const Head: React.FC<{ icon: LucideIcon; title: string; sub: string }> = ({ icon: Icon, title, sub }) => (
    <div className="ac-hd">
        <span className="ac-ic"><Icon size={21} strokeWidth={2.2} aria-hidden="true" /></span>
        <div className="min-w-0">
            <div className="ac-ttl">{title}</div>
            <div className="ac-sub">{sub}</div>
        </div>
    </div>
);

type CardProps = { className?: string };

export const QrCard: React.FC<CardProps> = ({ className = '' }) => (
    <div className={`acard ${className}`}>
        <Head icon={QrCode} title="Menu del tavolo 7" sub="QR dinamico · cambia a ogni cliente" />
        <div className="ac-hr" />
        <div className="ac-row"><span>Carbonara</span><span>13,00 €</span></div>
        <div className="ac-row"><span>Tagliata al rosmarino</span><span>22,00 €</span></div>
        <span className="pill p-dk">Ordina dal telefono →</span>
    </div>
);

export const OrderCard: React.FC<CardProps> = ({ className = '' }) => (
    <div className={`acard ${className}`}>
        <Head icon={BellRing} title="Nuovo ordine · Tavolo 7" sub="adesso · dal QR del tavolo" />
        <div className="ac-hr" />
        <div className="ac-row"><span>2× Carbonara</span><span>26,00 €</span></div>
        <div className="ac-row"><span>1× Tagliata al rosmarino</span><span>22,00 €</span></div>
        <div className="ac-row"><span>1× Rosso della casa</span><span>18,00 €</span></div>
        <span className="pill p-or"><span className="live-dot" aria-hidden="true" />Inviato in cucina</span>
    </div>
);

/** Il cronometro avanza solo quando la scheda è visibile (`live`). */
export const KitchenCard: React.FC<CardProps & { live?: boolean }> = ({ className = '', live = false }) => {
    const [sec, setSec] = useState(252);
    useEffect(() => {
        if (!live) return;
        const t = window.setInterval(() => setSec(s => s + 1), 1000);
        return () => window.clearInterval(t);
    }, [live]);
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return (
        <div className={`acard ${className}`}>
            <Head icon={ChefHat} title="Comanda stampata" sub="Tavolo 7 · 3 piatti · cucina" />
            <div className="ac-hr" />
            <div className="ac-row">
                <span>In preparazione</span>
                <span style={{ color: 'var(--orange-text)' }} aria-label={`da ${Number(mm)} minuti e ${Number(ss)} secondi`}>⏱ {mm}:{ss}</span>
            </div>
            <span className="pill p-ok">✓ Stampante cucina</span>
        </div>
    );
};

export const PayCard: React.FC<CardProps> = ({ className = '' }) => (
    <div className={`acard ${className}`}>
        <Head icon={CreditCard} title="Conto chiuso · Tavolo 7" sub="carta contactless · scontrino inviato" />
        <div className="ac-hr" />
        <div className="ac-big">86,50 €</div>
        <div className="flex flex-wrap gap-2">
            <span className="pill p-ok">✓ Pagato</span>
            <span className="pill p-or">+12 punti fedeltà</span>
        </div>
    </div>
);

export const AiCard: React.FC<CardProps & { compact?: boolean }> = ({ className = '', compact = false }) => (
    <div className={`acard is-ai ${className}`}>
        <Head icon={Sparkles} title={`${AI_NAME} · Com'è andata ieri`} sub="riepilogo delle 7:00" />
        <div className="ac-hr" />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="ac-big">1.840 €</span>
            <span className="pill p-ok">+12% vs sabato scorso</span>
        </div>
        {!compact && (
            <>
                <div className="ac-row"><span>Piatto più venduto</span><span>Carbonara · 38</span></div>
                <div className="ac-row"><span>Coperti</span><span>112</span></div>
                <div className="ac-row"><span>Prenotazioni stasera</span><span>24 coperti</span></div>
            </>
        )}
        <p className="text-[14px] font-semibold leading-snug">
            <span aria-hidden="true">💡 </span>Il tiramisù è finito alle 22:10: il sabato preparane di più.
        </p>
    </div>
);
