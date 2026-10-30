import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { resolveImageUrl } from '../../Utilities/Utilities';
import { buildGoogleFontsHref, FONT_BY_KEY } from '../../Utilities/fonts';
import { useMenuLook } from '../../Components/Client/MenuThemeProvider';
import { MenuPrice, MenuRule } from '../../Components/Client/MenuPrimitives';
import ClientCategoriesList from '../../Components/Client/ClientCategoriesList';
import type { MenuTokens } from '../menuTheme';
import type { ProductDto } from '../../types';
import { BookingForm, Btn, FbIcon, FeatureIcon, IgIcon, isDarkColor, LandingProps, SectionTitle, TkIcon } from './LandingPrimitives';
import {
    AboutSection, AnnouncementSection, CategoriesSection, ContactSection, FeaturesSection, FONT_PAIRINGS, GallerySection,
    HeroSection, HighlightsSection, HoursSection, LandingButton, LandingConfig, LandingGlobal, LandingSection, LocationSection,
    mailHref, mapsEmbedUrl, mapsSearchUrl, ReservationsSection, safeHttpsUrl, safeImageSrc, safeLinkHref, SectionStyle,
    telHref, TestimonialsSection, TextSection, toVideoEmbed, validHex, VideoSection, WEEKDAYS, whatsappHref,
} from './landingConfig';

/**
 * Sito vetrina "a sezioni" (StyleDto.landingConfig): stesse fondamenta del sito classico
 * (token del template, pulsanti, modulo di prenotazione) ma con sezioni ordinate, attivabili
 * e personalizzabili dal ristoratore. Tutti i testi sono resi come testo; i link passano
 * dagli helper di landingConfig (solo https / tel / mailto, video solo YouTube/Vimeo).
 */

interface Props extends LandingProps {
    config: LandingConfig;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const imgUrl = (src: string | undefined | null): string => {
    const s = safeImageSrc(src);
    if (!s) return '';
    return s.startsWith('blob:') ? s : resolveImageUrl(s, '');
};

const cssUrl = (u: string) => `url("${u.replace(/["\\\n\r]/g, '')}")`;
const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const BUTTON_RADIUS: Record<LandingGlobal['buttonShape'], string | undefined> = {
    template: undefined, square: '0px', rounded: '10px', pill: '999px',
};

const SPACING: Record<SectionStyle['spacing'], string> = {
    compact: 'py-8', normal: 'py-12', airy: 'py-20 md:py-28',
};

/** Variabili colore della sezione: sfondi pieni o foto invertono testi, filetti e pulsanti. */
function sectionColors(st: SectionStyle, t: MenuTokens): React.CSSProperties {
    let bg: string | null = null;
    let fg: string | null = null;
    const extra: Record<string, string> = {};
    if (st.bg === 'primary') {
        bg = t.accent; fg = t.accentText;
        extra['--menu-accent'] = t.accentText; extra['--menu-accent-text'] = t.accent;
    } else if (st.bg === 'secondary') {
        bg = t.secondary; fg = t.secondaryText;
        extra['--menu-secondary'] = t.secondaryText; extra['--menu-secondary-text'] = t.secondary;
    } else if (st.bg === 'custom') {
        bg = validHex(st.bgColor) || t.surface;
        fg = isDarkColor(bg) ? '#ffffff' : '#141414';
    } else if (st.bg === 'image') {
        const u = imgUrl(st.bgImage?.src);
        if (u) {
            const o = Math.max(0, Math.min(0.9, st.bgOverlay));
            return {
                backgroundImage: `linear-gradient(rgba(0,0,0,${o}), rgba(0,0,0,${o})), ${cssUrl(u)}`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                ...fgVars('#ffffff'),
            } as React.CSSProperties;
        }
    }
    if (!bg || !fg) return {};
    return { background: bg, ...fgVars(fg), ...extra } as React.CSSProperties;
}

function fgVars(fg: string): Record<string, string> {
    return {
        color: fg,
        '--menu-text': fg,
        '--menu-muted': mix(fg, 78),
        '--menu-emph': fg,
        '--menu-rule': mix(fg, 40),
        '--menu-border': mix(fg, 22),
        '--menu-card': mix(fg, 8),
    };
}

function cardStyle(g: LandingGlobal, look: MenuTokens['look']): React.CSSProperties {
    const base: React.CSSProperties = { background: 'var(--menu-card)', borderRadius: 'var(--menu-radius)' };
    switch (g.cardStyle) {
        case 'flat': return base;
        case 'bordered': return { ...base, border: '1px solid var(--menu-border)' };
        case 'shadow': return { ...base, boxShadow: '0 14px 34px -16px rgba(0,0,0,0.38)' };
        default: return {
            ...base,
            border: look.cardBorder === 'heavy' ? '2px solid var(--menu-text)' : look.cardBorder === 'none' ? 'none' : '1px solid var(--menu-border)',
            boxShadow: look.offsetShadow ? '5px 5px 0 var(--menu-text)' : 'none',
        };
    }
}

const Paragraphs: React.FC<{ text: string; className?: string; style?: React.CSSProperties }> = ({ text, className, style }) => (
    <>
        {text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean).map((t, i) => (
            <p key={i} className={`${i > 0 ? 'mt-4' : ''} ${className || ''}`} style={{ whiteSpace: 'pre-line', ...style }}>{t}</p>
        ))}
    </>
);

const Wave: React.FC = () => (
    <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="block w-full h-4 md:h-6" aria-hidden="true">
        <path d="M0 12 C 150 0, 300 24, 450 12 S 750 0, 900 12 S 1150 24, 1200 12" fill="none" stroke="var(--menu-rule)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
);

/**
 * Animazioni allo scroll: la classe che nasconde gli elementi (.lp-anim) viene messa solo dopo
 * che l'IntersectionObserver è partito. Niente observer / reduced motion = tutto visibile subito.
 */
function useReveal(rootRef: React.RefObject<HTMLDivElement>, enabled: boolean, deps: unknown): boolean {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const root = rootRef.current;
        const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!enabled || !root || typeof IntersectionObserver === 'undefined' || reduce) {
            setReady(false);
            return;
        }
        const io = new IntersectionObserver(entries => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    e.target.classList.add('lp-visible');
                    io.unobserve(e.target);
                }
            }
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
        const watch = (el: Element) => { if (!el.classList.contains('lp-visible')) io.observe(el); };
        root.querySelectorAll('[data-reveal]').forEach(watch);
        // Sezioni che compaiono dopo (categorie/piatti caricati più tardi, modifiche nell'anteprima) o a cui
        // React riscrive la classe (perdendo lp-visible): senza questo resterebbero nascoste per sempre.
        const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(records => {
            for (const r of records) {
                if (r.type === 'attributes') {
                    if (r.target instanceof Element && r.target.hasAttribute('data-reveal')) watch(r.target);
                    continue;
                }
                r.addedNodes.forEach(n => {
                    if (!(n instanceof Element)) return;
                    if (n.hasAttribute('data-reveal')) watch(n);
                    n.querySelectorAll('[data-reveal]').forEach(watch);
                });
            }
        });
        mo?.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-reveal'] });
        setReady(true);
        return () => { io.disconnect(); mo?.disconnect(); };
    }, [rootRef, enabled, deps]);
    return ready;
}

// ─── Contesto di rendering ────────────────────────────────────────────────────

interface Ctx {
    p: Props;
    t: MenuTokens;
    g: LandingGlobal;
    wrap: string;
    bookingOn: boolean;
    reservationsId: string | null;
    products: Map<number, ProductDto>;
    animate: boolean;
}

const alignOf = (a: 'template' | 'left' | 'center', t: MenuTokens) => (a === 'template' ? t.look.align === 'center' : a === 'center');

const DEFAULT_BUTTON_LABEL: Record<LandingButton['action'], string> = {
    menu: 'Sfoglia il menù', reserve: 'Prenota un tavolo', call: 'Chiama', whatsapp: 'Scrivici su WhatsApp', link: 'Scopri di più', takeaway: 'Asporto',
};

interface ResolvedButton { label: string; onClick?: () => void; href?: string }

function resolveButton(b: LandingButton, c: Ctx): ResolvedButton | null {
    const label = b.label.trim() || DEFAULT_BUTTON_LABEL[b.action];
    switch (b.action) {
        case 'menu': return { label, onClick: c.p.goToMenu };
        case 'takeaway': return { label, onClick: c.p.goToTakeaway };
        case 'reserve': {
            if (!c.bookingOn || !c.reservationsId) return null;
            const id = c.reservationsId;
            return { label, onClick: () => c.p.scrollTo(`sec-${id}`) };
        }
        case 'call': { const h = telHref(c.p.phone); return h ? { label, href: h } : null; }
        case 'whatsapp': { const h = whatsappHref(c.p.whatsapp); return h ? { label, href: h } : null; }
        case 'link': { const h = safeLinkHref(b.href); return h ? { label, href: h } : null; }
    }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_HEIGHT: Record<HeroSection['height'], string> = {
    medium: 'min(60vh, 520px)', large: 'min(82vh, 700px)', full: 'calc(100svh - 60px)',
};

const HeroView: React.FC<{ s: HeroSection; c: Ctx }> = ({ s, c }) => {
    const { p, t, wrap } = c;
    const imgs = s.images.map(i => ({ url: imgUrl(i.src), alt: i.alt })).filter(i => i.url);
    const variant = s.variant === 'template' ? (t.look.hero === 'overlay' ? 'image' : 'masthead') : s.variant;
    const centered = alignOf(s.align, t);
    const overlayColor = validHex(s.overlayColor) || p.heroBgColor;
    const overlayOpacity = s.overlayOpacity ?? p.heroOverlayOpacity;
    const heroDark = isDarkColor(overlayColor);
    const heroText = heroDark ? '#ffffff' : '#141414';
    const title = s.title.trim() || p.name;
    const subtitle = s.subtitle.trim() || p.description;
    const facts = s.showFacts ? [p.address, p.hours].filter(Boolean) : [];
    const minHeight = HERO_HEIGHT[s.height];
    const reveal = c.animate && s.style.animation !== 'none' ? s.style.animation : undefined;

    // Slideshow: cambio foto automatico (fermo con "riduci movimento")
    const [slide, setSlide] = useState(0);
    const count = variant === 'slideshow' ? imgs.length : 0;
    useEffect(() => {
        if (count < 2) return;
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => setSlide(x => (x + 1) % count), Math.max(3, s.interval) * 1000);
        return () => window.clearInterval(id);
    }, [count, s.interval]);
    const active = count ? slide % count : 0;

    const ctas = (onPhoto: boolean) => {
        const list = s.buttons.map(b => resolveButton(b, c)).filter((b): b is ResolvedButton => !!b);
        if (!list.length && !s.showTakeaway) return null;
        return (
            <div className={`flex flex-col sm:flex-row flex-wrap gap-3 mt-8 ${centered ? 'sm:justify-center' : ''}`}>
                {list.map((b, i) => (
                    i === 0
                        ? <Btn key={i} onClick={b.onClick} href={b.href}>{b.label}</Btn>
                        : onPhoto
                            ? <Btn key={i} variant="ghost" ghostColor={heroText} onClick={b.onClick} href={b.href}>{b.label}</Btn>
                            : <Btn key={i} variant="secondary" onClick={b.onClick} href={b.href}>{b.label}</Btn>
                ))}
                {s.showTakeaway && <Btn variant="ghost" ghostColor={onPhoto ? heroText : undefined} onClick={p.goToTakeaway}>Asporto</Btn>}
            </div>
        );
    };

    if (variant === 'image' || variant === 'slideshow') {
        const shown = variant === 'slideshow' ? imgs : imgs.slice(0, 1);
        return (
            <section id={`sec-${s.id}`} className="relative overflow-hidden" style={{ backgroundColor: overlayColor, minHeight }}>
                {shown.length > 0 && (
                    <>
                        {shown.map((im, i) => (
                            <img
                                key={im.url + i}
                                src={im.url}
                                alt={i === active ? im.alt : ''}
                                aria-hidden={i === active ? undefined : true}
                                className={`absolute inset-0 w-full h-full object-cover ${variant === 'slideshow' ? 'lp-slide' : 'menu-hero-img'}`}
                                style={{ opacity: variant === 'slideshow' ? (i === active ? 1 : 0) : 1 }}
                                loading={i === 0 ? 'eager' : 'lazy'}
                            />
                        ))}
                        <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
                    </>
                )}
                <div data-reveal={reveal} className={`relative ${wrap} flex flex-col justify-end ${centered ? 'text-center items-center' : ''}`} style={{ minHeight, paddingTop: 96, paddingBottom: 56 }}>
                    {facts.length > 0 && <p className="menu-label" style={{ color: heroText, opacity: 0.85 }}>{facts.join('  ·  ')}</p>}
                    <h1 className="menu-h mt-3" style={{ color: heroText, fontSize: 'clamp(3rem, 15vw, 7.5rem)', lineHeight: 0.95, textShadow: shown.length && heroDark ? '0 1px 18px rgba(0,0,0,0.35)' : 'none' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-4 max-w-xl" style={{ color: heroText, opacity: 0.9, fontSize: 'clamp(1rem, 3.6vw, 1.25rem)', lineHeight: 1.45 }}>{subtitle}</p>
                    )}
                    {ctas(true)}
                    {count > 1 && (
                        <div className="flex gap-2 mt-8" role="group" aria-label="Foto">
                            {imgs.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSlide(i)}
                                    aria-label={`Foto ${i + 1} di ${imgs.length}`}
                                    aria-current={i === active ? 'true' : undefined}
                                    className="menu-focus h-2.5 rounded-full transition-all"
                                    style={{ width: i === active ? 26 : 10, background: heroText, opacity: i === active ? 0.95 : 0.45 }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    if (variant === 'split') {
        const im = imgs[0];
        return (
            <section id={`sec-${s.id}`} className="overflow-hidden" style={sectionColors(s.style, t)}>
                <div className={`${wrap} grid grid-cols-1 ${im ? 'md:grid-cols-2' : ''} gap-8 md:gap-12 items-center py-10 md:py-16`} style={{ minHeight: s.height === 'medium' ? undefined : minHeight }}>
                    <div data-reveal={reveal} className={centered ? 'text-center flex flex-col items-center' : ''}>
                        {facts.length > 0 && <p className="menu-label">{facts.join('  ·  ')}</p>}
                        <h1 className="menu-h mt-3" style={{ fontSize: 'clamp(2.6rem, 9vw, 5.5rem)', lineHeight: 0.98, textAlign: centered ? 'center' : 'left' }}>{title}</h1>
                        {subtitle && <p className="mt-4 max-w-xl" style={{ color: 'var(--menu-muted)', fontSize: 'clamp(1rem, 3.4vw, 1.2rem)', lineHeight: 1.5 }}>{subtitle}</p>}
                        {ctas(false)}
                    </div>
                    {im && (
                        <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 5', maxHeight: minHeight, borderRadius: 'var(--menu-radius)', backgroundColor: overlayColor }}>
                            <img src={im.url} alt={im.alt} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </section>
        );
    }

    if (variant === 'minimal') {
        return (
            <section id={`sec-${s.id}`} style={sectionColors(s.style, t)}>
                <div data-reveal={reveal} className={`${wrap} flex flex-col justify-center ${centered ? 'text-center items-center' : ''}`} style={{ minHeight: s.height === 'medium' ? 280 : s.height === 'large' ? 440 : minHeight, paddingTop: 56, paddingBottom: 56 }}>
                    {p.logoImg && <img src={p.logoImg} alt="" className="w-16 h-16 object-cover mb-6" style={{ borderRadius: 'var(--menu-radius)' }} />}
                    {facts.length > 0 && <p className="menu-label">{facts.join('  ·  ')}</p>}
                    <h1 className="menu-h mt-3" style={{ fontSize: 'clamp(3rem, 13vw, 6.5rem)', lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>{title}</h1>
                    {subtitle && <p className="mt-5 max-w-xl" style={{ color: 'var(--menu-muted)', fontSize: 'clamp(1.05rem, 3.8vw, 1.3rem)', lineHeight: 1.5 }}>{subtitle}</p>}
                    {ctas(false)}
                </div>
            </section>
        );
    }

    // masthead: come il sito classico dei template "a testata"
    const im = imgs[0];
    return (
        <div id={`sec-${s.id}`}>
            <section data-reveal={reveal} className={`${wrap} pt-12 md:pt-20 pb-10 ${centered ? 'text-center' : ''}`}>
                {p.logoImg && (
                    <img src={p.logoImg} alt="" className={`w-16 h-16 object-cover mb-6 ${centered ? 'mx-auto' : ''}`} style={{ borderRadius: 'var(--menu-radius)' }} />
                )}
                {facts.length > 0 && <p className="menu-label">{facts.join('  ·  ')}</p>}
                <h1 className="menu-h mt-3" style={{ fontSize: 'clamp(3rem, 14vw, 6.5rem)', lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>{title}</h1>
                <MenuRule className={`mt-7 mb-6 ${centered ? 'mx-auto' : ''}`} style={{ maxWidth: centered ? 360 : undefined }} />
                {subtitle && (
                    <p className={`max-w-xl ${centered ? 'mx-auto' : ''}`} style={{ color: 'var(--menu-muted)', fontSize: 'clamp(1.05rem, 3.8vw, 1.3rem)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        {subtitle}
                    </p>
                )}
                {ctas(false)}
            </section>
            {im && (
                <figure className={`${wrap} pb-4`}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--menu-radius)', backgroundColor: overlayColor }}>
                        <img src={im.url} alt={im.alt} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </figure>
            )}
        </div>
    );
};

// ─── Sezioni di contenuto ─────────────────────────────────────────────────────

type ViewProps<S> = { s: S; c: Ctx; centered: boolean };

const AboutView: React.FC<ViewProps<AboutSection>> = ({ s, c, centered }) => {
    const u = imgUrl(s.image?.src);
    if (!u && !s.text.trim()) return null;
    return (
        <div className={`grid grid-cols-1 ${u ? 'md:grid-cols-2' : ''} gap-8 md:gap-12 items-center`}>
            {u && (
                <div className={`lp-item relative overflow-hidden ${s.imagePosition === 'right' ? 'md:order-2' : ''}`} style={{ aspectRatio: '4 / 3', borderRadius: 'var(--menu-radius)' }}>
                    <img src={u} alt={s.image?.alt || ''} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
            )}
            <div className="lp-item" style={{ ['--i' as any]: 1 }}>
                {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
                <div className={`${s.title.trim() ? '-mt-2' : ''} ${centered ? 'text-center' : ''}`} style={{ color: 'var(--menu-muted)', fontSize: '1.02rem', lineHeight: 1.7 }}>
                    <Paragraphs text={s.text} />
                </div>
            </div>
        </div>
    );
};

const GalleryView: React.FC<ViewProps<GallerySection>> = ({ s, centered }) => {
    const items = s.items.map(i => ({ ...i, url: imgUrl(i.src) })).filter(i => i.url);
    const track = useRef<HTMLDivElement>(null);
    if (!items.length) return null;
    const caption = (text?: string) => text?.trim()
        ? <figcaption className="mt-2 text-sm" style={{ color: 'var(--menu-muted)' }}>{text}</figcaption>
        : null;
    const head = s.title.trim() ? <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} /> : null;

    if (s.layout === 'carousel') {
        const scroll = (dir: 1 | -1) => {
            const el = track.current;
            if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
        };
        return (
            <>
                {head}
                <div className="relative">
                    <div ref={track} className="lp-scroll-snap flex gap-4 overflow-x-auto pb-3" tabIndex={0} aria-label={s.title || 'Galleria'} role="region">
                        {items.map((im, i) => (
                            <figure key={i} className="lp-item shrink-0 w-[82%] sm:w-[48%] lg:w-[38%]" style={{ ['--i' as any]: i }}>
                                <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--menu-radius)' }}>
                                    <img src={im.url} alt={im.alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                {caption(im.caption)}
                            </figure>
                        ))}
                    </div>
                    {items.length > 1 && (
                        <div className={`flex gap-2 mt-3 ${centered ? 'justify-center' : 'justify-end'}`}>
                            <button type="button" onClick={() => scroll(-1)} aria-label="Foto precedenti" className="menu-focus w-11 h-11 inline-flex items-center justify-center" style={{ border: '1px solid var(--menu-rule)', borderRadius: 'var(--lp-btn-radius, var(--menu-radius))' }}>
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button type="button" onClick={() => scroll(1)} aria-label="Foto successive" className="menu-focus w-11 h-11 inline-flex items-center justify-center" style={{ border: '1px solid var(--menu-rule)', borderRadius: 'var(--lp-btn-radius, var(--menu-radius))' }}>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </>
        );
    }

    if (s.layout === 'masonry') {
        return (
            <>
                {head}
                <div className="columns-2 md:columns-3 gap-3 md:gap-4">
                    {items.map((im, i) => (
                        <figure key={i} className="lp-item mb-3 md:mb-4" style={{ breakInside: 'avoid', ['--i' as any]: i }}>
                            <img src={im.url} alt={im.alt} loading="lazy" className="w-full h-auto block" style={{ borderRadius: 'var(--menu-radius)' }} />
                            {caption(im.caption)}
                        </figure>
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            {head}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {items.map((im, i) => (
                    <figure key={i} className="lp-item" style={{ ['--i' as any]: i }}>
                        <div className="relative overflow-hidden" style={{ aspectRatio: '1 / 1', borderRadius: 'var(--menu-radius)' }}>
                            <img src={im.url} alt={im.alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        {caption(im.caption)}
                    </figure>
                ))}
            </div>
        </>
    );
};

const FeaturesView: React.FC<ViewProps<FeaturesSection>> = ({ s, centered }) => {
    if (!s.items.length) return null;
    return (
        <>
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
                {s.items.map((f, i) => (
                    <li key={i} className={`lp-item py-5 ${centered ? 'text-center' : ''}`} style={{ borderTop: '1px solid var(--menu-rule)', ['--i' as any]: i }}>
                        <FeatureIcon icon={f.icon} className={`w-5 h-5 ${centered ? 'mx-auto' : ''}`} style={{ color: 'var(--menu-emph)' }} />
                        <p className="menu-h mt-3" style={{ fontSize: '1.12rem', lineHeight: 1.2, textAlign: centered ? 'center' : 'left' }}>{f.title}</p>
                        <p className="mt-1" style={{ color: 'var(--menu-muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>{f.sub}</p>
                    </li>
                ))}
            </ul>
        </>
    );
};

const priceOf = (pr: ProductDto) => (pr.options?.length ? pr.options[0].price : 0);

const HighlightsView: React.FC<ViewProps<HighlightsSection>> = ({ s, c, centered }) => {
    const list = s.productIds.map(id => c.products.get(id)).filter((x): x is ProductDto => !!x && x.available);
    if (!list.length) return null;
    const open = (pr: ProductDto) => c.p.navigate(`/${c.p.localname}/Products/${pr.idCategory}`);
    const head = s.title.trim() ? <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} /> : null;

    if (s.layout === 'list') {
        return (
            <>
                {head}
                <ul className="max-w-3xl mx-auto">
                    {list.map((pr, i) => {
                        const u = imgUrl(pr.image);
                        return (
                            <li key={pr.id} className="lp-item" style={{ borderTop: '1px solid var(--menu-border)', ['--i' as any]: i }}>
                                <button type="button" onClick={() => open(pr)} className="menu-focus menu-row w-full text-left flex items-center gap-4 py-4 px-1">
                                    {u && <img src={u} alt="" loading="lazy" className="w-14 h-14 object-cover flex-shrink-0" style={{ borderRadius: 'var(--menu-radius)' }} />}
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-baseline">
                                            <span className="menu-h truncate" style={{ fontSize: '1.15rem' }}>{pr.name}</span>
                                            {s.showPrices && <><span className="menu-leader" /><MenuPrice value={priceOf(pr)} from={(pr.options?.length || 0) > 1} /></>}
                                        </span>
                                        {pr.description && <span className="block mt-1 text-sm line-clamp-2" style={{ color: 'var(--menu-muted)' }}>{pr.description}</span>}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </>
        );
    }

    return (
        <>
            {head}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((pr, i) => {
                    const u = imgUrl(pr.image);
                    return (
                        <li key={pr.id} className="lp-item" style={{ ['--i' as any]: i }}>
                            <button type="button" onClick={() => open(pr)} className="menu-focus w-full h-full text-left overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5" style={cardStyle(c.g, c.t.look)}>
                                {u && (
                                    <span className="relative block w-full" style={{ aspectRatio: '4 / 3' }}>
                                        <img src={u} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                                    </span>
                                )}
                                <span className="block p-4">
                                    <span className="menu-h block" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{pr.name}</span>
                                    {pr.description && <span className="block mt-1.5 text-sm line-clamp-2" style={{ color: 'var(--menu-muted)' }}>{pr.description}</span>}
                                    {s.showPrices && <span className="block mt-3"><MenuPrice value={priceOf(pr)} from={(pr.options?.length || 0) > 1} /></span>}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
};

const Stars: React.FC<{ n: number }> = ({ n }) => (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n} stelle su 5`}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-4 h-4" aria-hidden="true" style={{ color: 'var(--menu-emph)', fill: i <= n ? 'currentColor' : 'transparent', opacity: i <= n ? 1 : 0.35 }} />
        ))}
    </span>
);

const TestimonialsView: React.FC<ViewProps<TestimonialsSection>> = ({ s, c, centered }) => {
    const items = s.items.filter(t => t.text.trim());
    if (!items.length) return null;
    return (
        <>
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((q, i) => (
                    <li key={i} className="lp-item p-6 flex flex-col" style={{ ...cardStyle(c.g, c.t.look), ['--i' as any]: i }}>
                        <Stars n={q.stars} />
                        <blockquote className="mt-3 flex-1" style={{ fontSize: '1.02rem', lineHeight: 1.6 }}>
                            <p style={{ whiteSpace: 'pre-line' }}>“{q.text}”</p>
                        </blockquote>
                        {q.author.trim() && <p className="menu-label mt-4">{q.author}</p>}
                    </li>
                ))}
            </ul>
        </>
    );
};

const HoursView: React.FC<ViewProps<HoursSection>> = ({ s, c, centered }) => {
    const hasAny = s.days.some(d => d.closed || d.text.trim());
    if (!hasAny) return null;
    const today = (new Date().getDay() + 6) % 7;
    return (
        <div className="max-w-2xl mx-auto">
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            <div className="p-5 md:p-7" style={cardStyle(c.g, c.t.look)}>
                <dl>
                    {s.days.map((d, i) => (
                        <div
                            key={i}
                            className="lp-item flex items-baseline justify-between gap-4 py-2.5"
                            style={{ borderTop: i > 0 ? '1px solid var(--menu-border)' : 'none', fontWeight: i === today ? 700 : 400, ['--i' as any]: i }}
                        >
                            <dt>{WEEKDAYS[i]}{i === today && <span className="menu-label ml-2" style={{ color: 'var(--menu-emph)' }}>Oggi</span>}</dt>
                            <dd className="text-right" style={{ color: d.closed ? 'var(--menu-muted)' : undefined }}>
                                {d.closed ? 'Chiuso' : (d.text.trim() || '—')}
                            </dd>
                        </div>
                    ))}
                </dl>
                {s.note.trim() && <p className="mt-4 text-sm" style={{ color: 'var(--menu-muted)' }}>{s.note}</p>}
            </div>
        </div>
    );
};

const LocationView: React.FC<ViewProps<LocationSection>> = ({ s, c, centered }) => {
    const address = c.p.address.trim();
    if (!address) return null;
    return (
        <div className={`grid grid-cols-1 ${s.showMap ? 'md:grid-cols-2' : ''} gap-8 items-center`}>
            <div className={`lp-item ${centered && !s.showMap ? 'text-center' : ''}`}>
                {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered && !s.showMap} />}
                <p className={`flex items-start gap-2 ${centered && !s.showMap ? 'justify-center' : ''}`} style={{ fontSize: '1.15rem' }}>
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" style={{ color: 'var(--menu-emph)' }} />
                    <span>{address}</span>
                </p>
                {s.text.trim() && <p className="mt-3" style={{ color: 'var(--menu-muted)', whiteSpace: 'pre-line' }}>{s.text}</p>}
                <div className="mt-6">
                    <Btn variant="secondary" href={mapsSearchUrl(address)}>Apri in Google Maps</Btn>
                </div>
            </div>
            {s.showMap && (
                <div className="lp-item relative overflow-hidden" style={{ aspectRatio: '4 / 3', borderRadius: 'var(--menu-radius)', border: '1px solid var(--menu-border)', ['--i' as any]: 1 }}>
                    <iframe
                        src={mapsEmbedUrl(address)}
                        title={`Mappa: ${address}`}
                        className="absolute inset-0 w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    />
                </div>
            )}
        </div>
    );
};

const ReservationsView: React.FC<ViewProps<ReservationsSection>> = ({ s, c, centered }) => {
    const [open, setOpen] = useState(false);
    if (!c.bookingOn) return null;
    const showForm = s.mode === 'form' || open;
    return (
        <div className={`${c.t.look.width === 'narrow' ? 'max-w-2xl' : 'max-w-3xl'} mx-auto`}>
            <SectionTitle eyebrow={s.eyebrow} title={s.title.trim() || 'Prenota un tavolo'} centered={centered} />
            {s.text.trim() && (
                <p className={`-mt-4 mb-6 ${centered ? 'text-center' : ''}`} style={{ color: 'var(--menu-muted)', fontSize: '0.92rem' }}>{s.text}</p>
            )}
            {showForm ? (
                <div className="lp-item p-5 md:p-8" style={{ ...cardStyle(c.g, c.t.look), background: 'var(--menu-card)' }}>
                    <BookingForm localname={c.p.localname} />
                </div>
            ) : (
                <div className={centered ? 'text-center' : ''}>
                    <Btn onClick={() => setOpen(true)}>Prenota ora</Btn>
                </div>
            )}
        </div>
    );
};

const socialBtn: React.CSSProperties = { minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--lp-btn-radius, var(--menu-radius))', fontSize: '0.9rem' };

const ContactView: React.FC<ViewProps<ContactSection>> = ({ s, c, centered }) => {
    const p = c.p;
    const tel = telHref(p.phone);
    const wa = whatsappHref(p.whatsapp);
    const mail = mailHref(s.email);
    const socials = [
        { href: safeHttpsUrl(p.instagramUrl), label: 'Instagram', icon: <IgIcon /> },
        { href: safeHttpsUrl(p.facebookUrl), label: 'Facebook', icon: <FbIcon /> },
        { href: safeHttpsUrl(p.tiktokUrl), label: 'TikTok', icon: <TkIcon /> },
        { href: safeHttpsUrl(s.tripadvisorUrl), label: 'TripAdvisor', icon: <ExternalLink className="w-4 h-4" aria-hidden="true" /> },
    ].filter(x => !!x.href);
    const hours = s.showHours ? p.hours : '';
    if (!p.address && !hours && !tel && !wa && !mail && !socials.length) return null;

    const item = (key: string, icon: React.ReactNode, label: string, value: React.ReactNode, i: number) => (
        <div key={key} className="lp-item py-4" style={{ borderTop: '1px solid var(--menu-border)', ['--i' as any]: i }}>
            <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>{icon} {label}</dt>
            <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>{value}</dd>
        </div>
    );
    const rows: React.ReactNode[] = [];
    if (p.address) rows.push(item('a', <MapPin className="w-3.5 h-3.5" aria-hidden="true" />, 'Indirizzo',
        <a className="menu-focus underline underline-offset-4" style={{ textDecorationColor: 'var(--menu-rule)' }} href={mapsSearchUrl(p.address)} target="_blank" rel="noopener noreferrer">{p.address}</a>, rows.length));
    if (hours) rows.push(item('h', <Clock className="w-3.5 h-3.5" aria-hidden="true" />, 'Orari', hours, rows.length));
    if (tel) rows.push(item('t', <Phone className="w-3.5 h-3.5" aria-hidden="true" />, 'Telefono', <a className="menu-focus" href={tel}>{p.phone}</a>, rows.length));
    if (wa) rows.push(item('w', <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />, 'WhatsApp', <a className="menu-focus" href={wa} target="_blank" rel="noopener noreferrer">{p.whatsapp}</a>, rows.length));
    if (mail) rows.push(item('m', <Mail className="w-3.5 h-3.5" aria-hidden="true" />, 'Email', <a className="menu-focus" href={mail}>{s.email.trim()}</a>, rows.length));

    return (
        <>
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            {rows.length > 0 && <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-x-10 ${centered ? 'text-center' : ''}`}>{rows}</dl>}
            {socials.length > 0 && (
                <div className={`mt-6 flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
                    {socials.map(x => (
                        <a key={x.label} className="menu-focus inline-flex items-center gap-2 px-4" style={socialBtn} href={x.href!} target="_blank" rel="noopener noreferrer">
                            {x.icon} {x.label}
                        </a>
                    ))}
                </div>
            )}
        </>
    );
};

const TextView: React.FC<ViewProps<TextSection>> = ({ s, centered }) => {
    if (!s.title.trim() && !s.text.trim()) return null;
    return (
        <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            <div className={s.title.trim() ? '-mt-2' : ''} style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--menu-muted)' }}>
                <Paragraphs text={s.text} />
            </div>
        </div>
    );
};

const VideoView: React.FC<ViewProps<VideoSection>> = ({ s, centered }) => {
    const embed = toVideoEmbed(s.videoUrl);
    if (!embed) return null;
    return (
        <div className="max-w-4xl mx-auto">
            {s.title.trim() && <SectionTitle eyebrow={s.eyebrow} title={s.title} centered={centered} />}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--menu-radius)', background: '#000' }}>
                <iframe
                    src={embed}
                    title={s.title.trim() || 'Video'}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
            {s.caption.trim() && <p className={`mt-3 text-sm ${centered ? 'text-center' : ''}`} style={{ color: 'var(--menu-muted)' }}>{s.caption}</p>}
        </div>
    );
};

const CategoriesView: React.FC<ViewProps<CategoriesSection>> = ({ s, c, centered }) => {
    const visible = c.p.categories.filter(x => x.id > 0 && x.available);
    if (!visible.length) return null;
    return (
        <>
            <SectionTitle eyebrow={s.eyebrow} title={s.title.trim() || c.p.sectionMenuTitle || 'Il menù'} centered={centered} />
            <ClientCategoriesList categories={c.p.categories} onSelectCategory={id => c.p.navigate(`/${c.p.localname}/Products/${id}`)} />
            {s.showButton && (
                <div className={`mt-8 ${centered ? 'text-center' : ''}`}>
                    <Btn variant="secondary" onClick={c.p.goToMenu}>Apri il menù completo</Btn>
                </div>
            )}
        </>
    );
};

const TickerView: React.FC<{ c: Ctx; centered: boolean }> = ({ c, centered }) => {
    const visible = c.p.categories.filter(x => x.id > 0 && x.available);
    if (!visible.length) return null;
    if (c.t.look.ticker === 'marquee') {
        return (
            <div className="overflow-hidden py-3" style={{ background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)' }} aria-hidden="true">
                <div className="whitespace-nowrap inline-flex menu-marquee">
                    {[...visible, ...visible, ...visible, ...visible].map((x, i) => (
                        <span key={i} className="menu-h inline-flex items-center" style={{ color: 'inherit', fontSize: '1.15rem', padding: '0 18px' }}>
                            {x.name}
                            <span style={{ marginLeft: 36, opacity: 0.5 }}>/</span>
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <nav aria-label="Categorie" className={`${c.wrap} py-5`}>
            <ul className={`flex flex-wrap gap-x-1 gap-y-1 ${centered ? 'justify-center' : ''}`}>
                {visible.map((x, i) => (
                    <li key={x.id} className="flex items-center">
                        {i > 0 && <span aria-hidden="true" style={{ color: 'var(--menu-rule)', padding: '0 4px' }}>·</span>}
                        <button
                            type="button"
                            onClick={() => c.p.navigate(`/${c.p.localname}/Products/${x.id}`)}
                            className="menu-focus"
                            style={{ minHeight: 40, padding: '0 6px', fontSize: '0.92rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                        >
                            {x.name}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const AnnouncementBar: React.FC<{ s: AnnouncementSection; t: MenuTokens }> = ({ s, t }) => {
    if (!s.text.trim()) return null;
    const bg = validHex(s.bgColor) || t.secondary;
    const fg = validHex(s.textColor) || (validHex(s.bgColor) ? (isDarkColor(bg) ? '#ffffff' : '#141414') : t.secondaryText);
    const href = safeHttpsUrl(s.href);
    return (
        <div id={`sec-${s.id}`} role="region" aria-label="Avviso" style={{ background: bg, color: fg }}>
            <p className="max-w-6xl mx-auto px-5 py-2.5 text-center text-sm" style={{ fontFamily: 'var(--menu-font-body)', fontWeight: 600 }}>
                <span>{s.text}</span>
                {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="menu-focus underline underline-offset-4 ml-2 whitespace-nowrap" style={{ color: fg }}>
                        {s.linkLabel.trim() || 'Scopri di più'}
                    </a>
                )}
            </p>
        </div>
    );
};

// ─── Pagina ───────────────────────────────────────────────────────────────────

const NO_RULE: LandingSection['type'][] = ['hero', 'ticker', 'features', 'announcement'];

/** Stesse condizioni delle viste che restituiscono null: evita sezioni vuote con solo padding. */
function hasContent(s: LandingSection, c: Ctx): boolean {
    const cats = () => c.p.categories.some(x => x.id > 0 && x.available);
    switch (s.type) {
        case 'about': return !!imgUrl(s.image?.src) || !!s.text.trim();
        case 'gallery': return s.items.some(i => !!imgUrl(i.src));
        case 'features': return s.items.length > 0;
        case 'highlights': return s.productIds.some(id => !!c.products.get(id)?.available);
        case 'testimonials': return s.items.some(x => !!x.text.trim());
        case 'hours': return s.days.some(d => d.closed || !!d.text.trim());
        case 'location': return !!c.p.address.trim();
        case 'reservations': return c.bookingOn;
        case 'contact': return !!(c.p.address || (s.showHours && c.p.hours) || telHref(c.p.phone) || whatsappHref(c.p.whatsapp) || mailHref(s.email)
            || safeHttpsUrl(c.p.instagramUrl) || safeHttpsUrl(c.p.facebookUrl) || safeHttpsUrl(c.p.tiktokUrl) || safeHttpsUrl(s.tripadvisorUrl));
        case 'text': return !!(s.title.trim() || s.text.trim());
        case 'video': return !!toVideoEmbed(s.videoUrl);
        case 'categories': return cats();
        default: return true;
    }
}

const SectionsLanding: React.FC<Props> = (p) => {
    const t = useMenuLook();
    const { look } = t;
    const { productsMap } = useData();
    const g = p.config.global;
    const rootRef = useRef<HTMLDivElement>(null);
    const animate = g.animation !== 'off';
    const ready = useReveal(rootRef, animate, p.config);
    const [showTop, setShowTop] = useState(false);

    const pairing = FONT_PAIRINGS.find(f => f.key === g.fontPairing);
    useEffect(() => {
        if (!pairing) return;
        const id = `lp-fonts-${pairing.key}`;
        if (document.getElementById(id)) return;
        const href = buildGoogleFontsHref([pairing.display, pairing.body]);
        if (!href) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, [pairing]);

    useEffect(() => {
        if (!g.backToTop) return;
        const onScroll = () => setShowTop(window.scrollY > 600);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [g.backToTop]);

    const rootVars = useMemo(() => {
        const v: Record<string, string> = {};
        if (pairing) {
            const d = FONT_BY_KEY[pairing.display]?.family;
            const b = FONT_BY_KEY[pairing.body]?.family;
            if (d) { v['--menu-font-display'] = d; v['--menu-font-accent'] = d; }
            if (b) { v['--menu-font-body'] = b; v['--menu-font-price'] = b; }
        }
        const r = BUTTON_RADIUS[g.buttonShape];
        if (r) v['--lp-btn-radius'] = r;
        return v;
    }, [pairing, g.buttonShape]);

    const enabled = p.config.sections.filter(s => s.enabled);
    const announcements = enabled.filter((s): s is AnnouncementSection => s.type === 'announcement');
    const body = enabled.filter(s => s.type !== 'announcement');
    const reservations = body.find(s => s.type === 'reservations');

    const c: Ctx = {
        p, t, g,
        wrap: `${look.width === 'narrow' ? 'max-w-3xl' : 'max-w-6xl'} mx-auto px-5 md:px-8`,
        bookingOn: p.showBooking,
        reservationsId: reservations && p.showBooking ? reservations.id : null,
        products: productsMap,
        animate,
    };

    // Voci del menu in alto: solo le sezioni presenti
    const navItems: [string, string][] = [];
    const firstOf = (types: LandingSection['type'][]) => body.find(s => types.includes(s.type));
    const menuSec = firstOf(['categories', 'highlights']);
    if (menuSec) navItems.push(['Menù', menuSec.id]);
    const aboutSec = firstOf(['about']);
    if (aboutSec) navItems.push(['Chi siamo', aboutSec.id]);
    const whereSec = firstOf(['location', 'contact']);
    if (whereSec) navItems.push(['Dove siamo', whereSec.id]);
    if (c.reservationsId) navItems.push(['Prenota', c.reservationsId]);

    const renderBody = (s: LandingSection, index: number) => {
        if (s.type === 'hero') return <HeroView key={s.id} s={s} c={c} />;
        const centered = alignOf(s.style.titleAlign, t);
        if (s.type === 'ticker') return <TickerView key={s.id} c={c} centered={centered} />;

        let content: React.ReactNode = null;
        const vp = { c, centered };
        switch (s.type) {
            case 'about': content = <AboutView s={s} {...vp} />; break;
            case 'gallery': content = <GalleryView s={s} {...vp} />; break;
            case 'features': content = <FeaturesView s={s} {...vp} />; break;
            case 'highlights': content = <HighlightsView s={s} {...vp} />; break;
            case 'testimonials': content = <TestimonialsView s={s} {...vp} />; break;
            case 'hours': content = <HoursView s={s} {...vp} />; break;
            case 'location': content = <LocationView s={s} {...vp} />; break;
            case 'reservations': content = <ReservationsView s={s} {...vp} />; break;
            case 'contact': content = <ContactView s={s} {...vp} />; break;
            case 'text': content = <TextView s={s} {...vp} />; break;
            case 'video': content = <VideoView s={s} {...vp} />; break;
            case 'categories': content = <CategoriesView s={s} {...vp} />; break;
        }
        // Sezione senza contenuti (es. galleria senza foto): non lascia spazi vuoti né filetti
        if (!hasContent(s, c)) return null;

        const colors = sectionColors(s.style, t);
        const plainBg = s.style.bg === 'theme' || Object.keys(colors).length === 0;
        const prev = index > 0 ? body[index - 1] : null;
        const showRule = plainBg && prev && (
            g.dividers === 'line' ? true
                : g.dividers === 'template' ? !NO_RULE.includes(s.type)
                    : false
        );
        const reveal = animate && s.style.animation !== 'none' ? s.style.animation : undefined;

        return (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-16" style={colors}>
                {g.dividers === 'wave' && prev && prev.type !== 'hero' && plainBg && <div className={c.wrap}><Wave /></div>}
                <div className={`${c.wrap} ${SPACING[s.style.spacing]}`}>
                    {showRule && (g.dividers === 'line'
                        ? <div className="menu-rule menu-rule--hairline mb-10" aria-hidden="true" />
                        : <MenuRule className="mb-10" />)}
                    <div data-reveal={reveal}>{content}</div>
                </div>
            </section>
        );
    };

    return (
        <div
            ref={rootRef}
            className={`menu-page min-h-screen overflow-x-hidden ${ready ? 'lp-anim' : ''}`}
            data-lp-intensity={g.animation}
            style={{ ...(p.pageBgGradient ? { background: p.pageBgGradient } : {}), ...rootVars } as React.CSSProperties}
        >
            {announcements.map(a => <AnnouncementBar key={a.id} s={a} t={t} />)}

            {/* Barra superiore */}
            <header className="sticky top-0 z-40 menu-page" style={{ borderBottom: '1px solid var(--menu-rule)', ...(p.pageBgGradient ? { background: 'var(--menu-bg)' } : {}) }}>
                <div className={`${look.width === 'narrow' ? 'max-w-5xl' : 'max-w-6xl'} mx-auto px-5 md:px-8 h-[60px] flex items-center justify-between gap-4`}>
                    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="menu-focus flex items-center gap-3 min-w-0" aria-label={`${p.name}, torna su`}>
                        {p.logoImg && <img src={p.logoImg} alt="" className="w-9 h-9 object-cover flex-shrink-0" style={{ borderRadius: 'var(--menu-radius)' }} />}
                        <span className="menu-h truncate" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{p.name}</span>
                    </button>
                    <nav className="flex items-center gap-1" aria-label="Sezioni">
                        {navItems.map(([label, id]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => p.scrollTo(`sec-${id}`)}
                                className="menu-focus hidden md:inline-flex items-center px-3"
                                style={{ minHeight: 44, fontSize: '0.88rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                            >
                                {label}
                            </button>
                        ))}
                        <span className="ml-2"><Btn onClick={p.goToMenu}>Ordina</Btn></span>
                    </nav>
                </div>
            </header>

            {g.dividers === 'template' && look.divider === 'checker' && <MenuRule />}

            {body.map(renderBody)}

            {/* Piede */}
            <footer className="mt-8">
                {g.dividers !== 'none' && (g.dividers === 'wave' ? <Wave /> : <MenuRule />)}
                <div className={`${c.wrap} py-10 ${look.align === 'center' ? 'text-center' : ''}`}>
                    <p className="menu-h" style={{ fontSize: '1.6rem', textAlign: look.align === 'center' ? 'center' : 'left' }}>{p.name}</p>
                    {(p.address || p.phone) && (
                        <p className="mt-2" style={{ color: 'var(--menu-muted)', fontSize: '0.88rem' }}>{[p.address, p.phone].filter(Boolean).join('  ·  ')}</p>
                    )}
                    <p className="mt-6" style={{ color: 'var(--menu-muted)', fontSize: '0.75rem' }}>
                        © {new Date().getFullYear()} {p.name} · Powered by AxiomGroup
                    </p>
                </div>
            </footer>

            {g.backToTop && showTop && (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Torna su"
                    className="menu-focus fixed bottom-5 right-5 z-40 w-12 h-12 inline-flex items-center justify-center shadow-lg"
                    style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)', borderRadius: 'var(--lp-btn-radius, 999px)' }}
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default SectionsLanding;
