import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { AiCard, KitchenCard, OrderCard, PayCard, QrCard } from './AppCards';

/*
 * "Una sera, dall'ordine al conto": cinque foto reali dello stesso locale con la scheda
 * dell'app corrispondente sovrapposta.
 * Desktop: elenco dei momenti a sinistra (tab) + palco con dissolvenza, avanzamento automatico
 * solo quando la sezione è visibile, con pausa.  Mobile: carosello a scorrimento con snap.
 */

type Scene = {
    id: string;
    time: string;
    title: string;
    text: string;
    img: string;
    alt: string;
    /** posizione della scheda sul palco desktop */
    place: string;
    card: (live: boolean) => React.ReactNode;
};

const SCENES: Scene[] = [
    {
        id: 'qr', time: '20:41', title: 'Il tavolo ordina',
        text: 'Lo schermino e-ink sul tavolo mostra un QR che cambia a ogni cliente. Si inquadra, si sceglie, si ordina.',
        img: '/landing/qr.webp',
        alt: 'Una cliente al tavolo sfoglia il menu sul telefono accanto allo schermino e-ink con il QR',
        place: 'left-6 bottom-6',
        card: () => <QrCard />,
    },
    {
        id: 'sala', time: '20:41', title: 'La sala lo sa subito',
        text: 'L’ordine arriva su Omnivo Sala, l’app dei camerieri, con aggiunte e note già scritte.',
        img: '/landing/sala.webp',
        alt: 'Una cameriera in sala controlla un nuovo ordine sul telefono',
        place: 'left-6 bottom-6',
        card: () => <OrderCard />,
    },
    {
        id: 'cucina', time: '20:42', title: 'La cucina stampa da sola',
        text: 'La comanda esce dalla stampante del reparto giusto. Nessun foglietto da ricopiare.',
        img: '/landing/cucina.webp',
        alt: 'Una stampante di comande al passe della cucina, con i piatti pronti e il cuoco ai fornelli',
        place: 'right-6 top-6',
        card: live => <KitchenCard live={live} />,
    },
    {
        id: 'cassa', time: '22:58', title: 'Il conto si chiude al tavolo',
        text: 'Contactless, sul conto Stripe o SumUp del locale. I punti fedeltà si caricano da soli.',
        img: '/landing/cassa.webp',
        alt: 'Un cliente sorridente paga con la carta contactless sul terminale della cameriera',
        place: 'left-6 bottom-6',
        card: () => <PayCard />,
    },
    {
        id: 'mattina', time: '07:00', title: 'La mattina dopo',
        text: 'Col primo caffè, AxiomAI ti racconta com’è andata e cosa cambiare per stasera.',
        img: '/landing/mattina.webp',
        alt: 'Il titolare, nel locale ancora vuoto, legge il riepilogo sul telefono con un caffè',
        place: 'right-6 bottom-6',
        card: () => <AiCard compact />,
    },
];

const DURATION = 6000;

const EveningStory: React.FC = () => {
    const reduce = useReducedMotion();
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hover, setHover] = useState(false);
    const stageRef = useRef<HTMLDivElement>(null);
    const inView = useInView(stageRef, { amount: 0.45 });
    const running = !reduce && !paused && !hover && inView;

    useEffect(() => {
        if (!running) return;
        const t = window.setTimeout(() => setActive(a => (a + 1) % SCENES.length), DURATION);
        return () => window.clearTimeout(t);
    }, [running, active]);

    const choose = (i: number) => { setActive(i); setPaused(true); };

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        let n = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % SCENES.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + SCENES.length) % SCENES.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = SCENES.length - 1;
        if (n < 0) return;
        e.preventDefault();
        choose(n);
        document.getElementById(`scene-tab-${SCENES[n].id}`)?.focus();
    };

    const scene = SCENES[active];

    return (
        <>
            {/* ── Desktop ───────────────────────────────────────── */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10 items-center"
                 onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="col-span-4">
                    <div role="tablist" aria-label="I momenti della serata" aria-orientation="vertical" className="border-b border-[var(--rule-2)]">
                        {SCENES.map((s, i) => {
                            const on = i === active;
                            return (
                                <button
                                    key={s.id}
                                    id={`scene-tab-${s.id}`}
                                    role="tab"
                                    type="button"
                                    aria-selected={on}
                                    aria-controls="scene-panel"
                                    tabIndex={on ? 0 : -1}
                                    className="step-btn"
                                    onClick={() => choose(i)}
                                    onKeyDown={e => onTabKey(e, i)}
                                >
                                    {on && (
                                        <motion.span
                                            key={`${s.id}-${running}`}
                                            className="step-bar"
                                            aria-hidden="true"
                                            initial={{ scaleX: running ? 0 : 1 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: running ? DURATION / 1000 : 0, ease: 'linear' }}
                                        />
                                    )}
                                    <span className="step-time">{s.time}</span>
                                    <span className="step-title">{s.title}</span>
                                    <AnimatePresence initial={false}>
                                        {on && (
                                            <motion.span
                                                className="step-text overflow-hidden"
                                                initial={reduce ? false : { height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                                            >
                                                <span className="block pt-1">{s.text}</span>
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            );
                        })}
                    </div>
                    {!reduce && (
                        <button
                            type="button"
                            onClick={() => setPaused(p => !p)}
                            className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                            {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
                            {paused ? 'Riprendi la sequenza' : 'Metti in pausa'}
                        </button>
                    )}
                </div>

                <div className="col-span-8">
                    <div ref={stageRef} id="scene-panel" role="tabpanel" aria-labelledby={`scene-tab-${scene.id}`} className="stage">
                        {SCENES.map((s, i) => (
                            <img
                                key={s.id}
                                src={s.img}
                                alt={i === active ? s.alt : ''}
                                aria-hidden={i !== active}
                                width={1600}
                                height={893}
                                loading="lazy"
                                decoding="async"
                                className={i === active ? 'is-on' : ''}
                            />
                        ))}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scene.id}
                                className={`stage-card ${scene.place}`}
                                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={reduce ? undefined : { opacity: 0, y: 10, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.5, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                {scene.card(inView)}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Mobile / tablet ───────────────────────────────── */}
            <MobileCarousel />
        </>
    );
};

const MobileCarousel: React.FC = () => {
    const trackRef = useRef<HTMLOListElement>(null);
    const [current, setCurrent] = useState(0);

    const onScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const items = Array.from(el.children) as HTMLElement[];
        const left = el.scrollLeft;
        let best = 0;
        let dist = Infinity;
        items.forEach((it, i) => {
            const d = Math.abs(it.offsetLeft - el.offsetLeft - left - parseFloat(getComputedStyle(el).paddingLeft || '0'));
            if (d < dist) { dist = d; best = i; }
        });
        setCurrent(best);
    }, []);

    const go = (i: number) => {
        const el = trackRef.current;
        const item = el?.children[i] as HTMLElement | undefined;
        if (!el || !item) return;
        el.scrollTo({ left: item.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || '0'), behavior: 'smooth' });
    };

    return (
        <div className="lg:hidden -mx-[var(--gutter)]">
            <ol
                ref={trackRef}
                className="snap"
                onScroll={onScroll}
                aria-label="I momenti della serata, scorri per vederli tutti"
                tabIndex={0}
            >
                {SCENES.map((s, i) => (
                    <li key={s.id} aria-label={`${i + 1} di ${SCENES.length}: ${s.title}`}>
                        <div className="snap-photo">
                            <img src={s.img} alt={s.alt} width={1600} height={893} loading="lazy" decoding="async" />
                        </div>
                        <div className="relative -mt-16 px-3 [&_.acard]:max-w-none [&_.acard]:p-4">
                            {s.card(i === current)}
                        </div>
                        <div className="mt-4 px-1">
                            <p className="step-time text-[var(--orange-text)]">{s.time}</p>
                            <h3 className="step-title mt-0.5">{s.title}</h3>
                            <p className="mt-1 text-[15px] text-[var(--ink-2)]">{s.text}</p>
                        </div>
                    </li>
                ))}
            </ol>
            <div className="dots mt-5 flex justify-center gap-2" aria-hidden="false">
                {SCENES.map((s, i) => (
                    <button
                        key={s.id}
                        type="button"
                        aria-label={`Vai a: ${s.title}`}
                        aria-current={i === current}
                        onClick={() => go(i)}
                    />
                ))}
            </div>
        </div>
    );
};

export default EveningStory;
