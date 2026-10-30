import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { resolveImageUrl } from '../../Utilities/Utilities';
import CustomLoading from '../../Components/CustomLoading';
import { CategoryDto, FeatureCard } from '../../types';
import { MapPin, Clock, MessageCircle, Phone } from 'lucide-react';
import { usePreviewStyles } from '../usePreviewStyles';
import { useMenuLook } from '../../Components/Client/MenuThemeProvider';
import { MenuRule } from '../../Components/Client/MenuPrimitives';
import ClientCategoriesList from '../../Components/Client/ClientCategoriesList';
import { getTemplateDef } from '../menuTemplates';
import { BookingForm, Btn, FbIcon, FeatureIcon, IgIcon, isDarkColor, LandingProps, SectionTitle, TkIcon } from '../landing/LandingPrimitives';
import { DEFAULT_FEATURE_CARDS, parseLandingConfig } from '../landing/landingConfig';
import SectionsLanding from '../landing/SectionsLanding';

/**
 * Sito vetrina pubblico del locale (`/:localname`).
 *
 * Un'unica struttura per tutti i template della libreria (`menuTemplates.ts`):
 * colori, font, filetti, intestazione e impaginazione delle categorie arrivano
 * dal "look" del template via CSS variables + `useMenuLook()`. Così ogni
 * template ha le stesse funzioni (prenotazione, asporto, info, social…) e
 * cambia solo l'aspetto.
 */

// ─── Landing ──────────────────────────────────────────────────────────────────


const TemplateLanding: React.FC<LandingProps> = (p) => {
    const { look } = useMenuLook();
    const centered = look.align === 'center';
    const wrap = `${look.width === 'narrow' ? 'max-w-3xl' : 'max-w-6xl'} mx-auto px-5 md:px-8`;
    const visibleCats = p.categories.filter(c => c.id > 0 && c.available);
    const hasSocial = p.instagramUrl.length > 5 || p.facebookUrl.length > 5 || p.tiktokUrl.length > 5;

    const navItems: [string, string][] = [
        ...(visibleCats.length > 0 ? [['Menù', 'categories'] as [string, string]] : []),
        ['Dove siamo', 'info'],
        ...(p.showBooking ? [['Prenota', 'prenota'] as [string, string]] : []),
    ];

    // ── Intestazione ───────────────────────────────────────────────────────
    const heroDark = isDarkColor(p.heroBgColor);
    const heroText = heroDark ? '#ffffff' : '#141414';

    const ctas = (onPhoto: boolean) => (
        <div className={`flex flex-col sm:flex-row flex-wrap gap-3 mt-8 ${centered ? 'sm:justify-center' : ''}`}>
            <Btn onClick={p.goToMenu}>Sfoglia il menù</Btn>
            {p.showBooking && (
                onPhoto
                    ? <Btn variant="ghost" ghostColor={heroText} onClick={() => p.scrollTo('prenota')}>Prenota un tavolo</Btn>
                    : <Btn variant="secondary" onClick={() => p.scrollTo('prenota')}>Prenota un tavolo</Btn>
            )}
            <Btn variant="ghost" ghostColor={onPhoto ? heroText : undefined} onClick={p.goToTakeaway}>Asporto</Btn>
        </div>
    );

    const facts = [p.address, p.hours].filter(Boolean);

    const hero = look.hero === 'overlay' ? (
        <section className="relative overflow-hidden" style={{ backgroundColor: p.heroBgColor, minHeight: 'min(82vh, 700px)' }}>
            {p.heroImg && (
                <>
                    <img src={p.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover menu-hero-img" />
                    <div className="absolute inset-0" style={{ backgroundColor: p.heroBgColor, opacity: p.heroOverlayOpacity }} />
                </>
            )}
            <div className={`relative ${wrap} flex flex-col justify-end ${centered ? 'text-center items-center' : ''}`} style={{ minHeight: 'min(82vh, 700px)', paddingTop: 96, paddingBottom: 56 }}>
                {facts.length > 0 && (
                    <p className="menu-label" style={{ color: heroText, opacity: 0.85 }}>{facts.join('  ·  ')}</p>
                )}
                <h1
                    className="menu-h mt-3"
                    style={{
                        color: heroText,
                        fontSize: 'clamp(3rem, 15vw, 7.5rem)',
                        lineHeight: 0.95,
                        textShadow: p.heroImg && heroDark ? '0 1px 18px rgba(0,0,0,0.35)' : 'none',
                    }}
                >
                    {p.name}
                </h1>
                {p.description && (
                    <p className="mt-4 max-w-xl" style={{ color: heroText, opacity: 0.9, fontSize: 'clamp(1rem, 3.6vw, 1.25rem)', lineHeight: 1.45 }}>
                        {p.description}
                    </p>
                )}
                {ctas(true)}
            </div>
        </section>
    ) : (
        <>
            <section className={`${wrap} pt-12 md:pt-20 pb-10 ${centered ? 'text-center' : ''}`}>
                {p.logoImg && (
                    <img
                        src={p.logoImg}
                        alt=""
                        className={`w-16 h-16 object-cover mb-6 ${centered ? 'mx-auto' : ''}`}
                        style={{ borderRadius: 'var(--menu-radius)' }}
                    />
                )}
                {facts.length > 0 && <p className="menu-label">{facts.join('  ·  ')}</p>}
                <h1 className="menu-h mt-3" style={{ fontSize: 'clamp(3rem, 14vw, 6.5rem)', lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>
                    {p.name}
                </h1>
                <MenuRule className={`mt-7 mb-6 ${centered ? 'mx-auto' : ''}`} style={{ maxWidth: centered ? 360 : undefined }} />
                {p.description && (
                    <p
                        className={`max-w-xl ${centered ? 'mx-auto' : ''}`}
                        style={{ color: 'var(--menu-muted)', fontSize: 'clamp(1.05rem, 3.8vw, 1.3rem)', lineHeight: 1.5, fontStyle: 'italic' }}
                    >
                        {p.description}
                    </p>
                )}
                {ctas(false)}
            </section>
            {p.heroImg && (
                <figure className={`${wrap} pb-4`}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--menu-radius)', backgroundColor: p.heroBgColor }}>
                        <img src={p.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </figure>
            )}
        </>
    );

    // ── Striscia categorie ─────────────────────────────────────────────────
    const strip = p.showTicker && visibleCats.length > 0 && (
        look.ticker === 'marquee' ? (
            <div className="overflow-hidden py-3" style={{ background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)' }} aria-hidden="true">
                <div className="whitespace-nowrap inline-flex menu-marquee">
                    {[...visibleCats, ...visibleCats, ...visibleCats, ...visibleCats].map((c, i) => (
                        <span key={i} className="menu-h inline-flex items-center" style={{ color: 'inherit', fontSize: '1.15rem', padding: '0 18px' }}>
                            {c.name}
                            <span style={{ marginLeft: 36, opacity: 0.5 }}>/</span>
                        </span>
                    ))}
                </div>
            </div>
        ) : (
            <nav aria-label="Categorie" className={`${wrap} py-5`}>
                <ul className={`flex flex-wrap gap-x-1 gap-y-1 ${centered ? 'justify-center' : ''}`}>
                    {visibleCats.map((c, i) => (
                        <li key={c.id} className="flex items-center">
                            {i > 0 && <span aria-hidden="true" style={{ color: 'var(--menu-rule)', padding: '0 4px' }}>·</span>}
                            <button
                                type="button"
                                onClick={() => p.navigate(`/${p.localname}/Products/${c.id}`)}
                                className="menu-focus"
                                style={{ minHeight: 40, padding: '0 6px', fontSize: '0.92rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                            >
                                {c.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        )
    );

    return (
        <div className="menu-page min-h-screen overflow-x-hidden" style={p.pageBgGradient ? { background: p.pageBgGradient } : undefined}>
            {/* Barra superiore */}
            <header className="sticky top-0 z-40 menu-page" style={{ borderBottom: '1px solid var(--menu-rule)', ...(p.pageBgGradient ? { background: 'var(--menu-bg)' } : {}) }}>
                <div className={`${look.width === 'narrow' ? 'max-w-5xl' : 'max-w-6xl'} mx-auto px-5 md:px-8 h-[60px] flex items-center justify-between gap-4`}>
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="menu-focus flex items-center gap-3 min-w-0"
                        aria-label={`${p.name}, torna su`}
                    >
                        {p.logoImg && (
                            <img src={p.logoImg} alt="" className="w-9 h-9 object-cover flex-shrink-0" style={{ borderRadius: 'var(--menu-radius)' }} />
                        )}
                        <span className="menu-h truncate" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{p.name}</span>
                    </button>
                    <nav className="flex items-center gap-1" aria-label="Sezioni">
                        {navItems.map(([label, id]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => p.scrollTo(id)}
                                className="menu-focus hidden md:inline-flex items-center px-3"
                                style={{ minHeight: 44, fontSize: '0.88rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                            >
                                {label}
                            </button>
                        ))}
                        <span className="ml-2">
                            <Btn onClick={p.goToMenu}>Ordina</Btn>
                        </span>
                    </nav>
                </div>
            </header>

            {look.divider === 'checker' && <MenuRule />}

            {hero}
            {strip}

            {/* Perché noi */}
            {p.showWhyUs && (
                <section className={`${wrap} py-12`}>
                    {p.sectionWhyTitle && <SectionTitle title={p.sectionWhyTitle} centered={centered} />}
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
                        {p.features.map((f, i) => (
                            <li key={i} className={`py-5 ${centered ? 'text-center' : ''}`} style={{ borderTop: '1px solid var(--menu-rule)' }}>
                                <FeatureIcon icon={f.icon} className={`w-5 h-5 ${centered ? 'mx-auto' : ''}`} style={{ color: 'var(--menu-emph)' }} />
                                <p className="menu-h mt-3" style={{ fontSize: '1.12rem', lineHeight: 1.2, textAlign: centered ? 'center' : 'left' }}>{f.title}</p>
                                <p className="mt-1" style={{ color: 'var(--menu-muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>{f.sub}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Menù */}
            {visibleCats.length > 0 && (
                <section id="categories" className={`${wrap} py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Dalla nostra cucina" title={p.sectionMenuTitle || 'Il menù'} centered={centered} />
                    <ClientCategoriesList
                        categories={p.categories}
                        onSelectCategory={id => p.navigate(`/${p.localname}/Products/${id}`)}
                    />
                    <div className={`mt-8 ${centered ? 'text-center' : ''}`}>
                        <Btn variant="secondary" onClick={p.goToMenu}>Apri il menù completo</Btn>
                    </div>
                </section>
            )}

            {/* Dove siamo */}
            {(p.address || p.hours || p.phone || p.whatsapp || hasSocial) && (
                <section id="info" className={`${wrap} py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Informazioni" title="Dove siamo" centered={centered} />
                    <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-x-10 ${centered ? 'text-center' : ''}`}>
                        {p.address && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Indirizzo</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>
                                    <a className="menu-focus underline underline-offset-4" style={{ textDecorationColor: 'var(--menu-rule)' }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer">
                                        {p.address}
                                    </a>
                                </dd>
                            </div>
                        )}
                        {p.hours && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><Clock className="w-3.5 h-3.5" aria-hidden="true" /> Orari</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>{p.hours}</dd>
                            </div>
                        )}
                        {p.phone && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><Phone className="w-3.5 h-3.5" aria-hidden="true" /> Telefono</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}><a className="menu-focus" href={`tel:${p.phone}`}>{p.phone}</a></dd>
                            </div>
                        )}
                        {p.whatsapp && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>
                                    <a className="menu-focus" href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">{p.whatsapp}</a>
                                </dd>
                            </div>
                        )}
                    </dl>
                    {hasSocial && (
                        <div className={`mt-6 flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
                            {p.instagramUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.instagramUrl} target="_blank" rel="noopener noreferrer"><IgIcon /> Instagram</a>}
                            {p.facebookUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.facebookUrl} target="_blank" rel="noopener noreferrer"><FbIcon /> Facebook</a>}
                            {p.tiktokUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.tiktokUrl} target="_blank" rel="noopener noreferrer"><TkIcon /> TikTok</a>}
                        </div>
                    )}
                </section>
            )}

            {/* Prenota */}
            {p.showBooking && (
                <section id="prenota" className={`${look.width === 'narrow' ? 'max-w-2xl' : 'max-w-3xl'} mx-auto px-5 md:px-8 py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Prenotazioni" title={p.sectionBookingTitle || 'Prenota un tavolo'} centered={centered} />
                    <p className={`-mt-4 mb-6 ${centered ? 'text-center' : ''}`} style={{ color: 'var(--menu-muted)', fontSize: '0.92rem' }}>
                        Compila il modulo: ti ricontattiamo per confermare.
                    </p>
                    <div
                        className="p-5 md:p-8"
                        style={{
                            background: 'var(--menu-card)',
                            border: look.cardBorder === 'heavy' ? '2px solid var(--menu-text)' : '1px solid var(--menu-border)',
                            borderRadius: 'var(--menu-radius)',
                            boxShadow: look.offsetShadow ? '5px 5px 0 var(--menu-text)' : 'none',
                        }}
                    >
                        <BookingForm localname={p.localname} />
                    </div>
                </section>
            )}

            {/* Piede */}
            <footer className="mt-8">
                <MenuRule />
                <div className={`${wrap} py-10 ${centered ? 'text-center' : ''}`}>
                    <p className="menu-h" style={{ fontSize: '1.6rem', textAlign: centered ? 'center' : 'left' }}>{p.name}</p>
                    {(p.address || p.phone) && (
                        <p className="mt-2" style={{ color: 'var(--menu-muted)', fontSize: '0.88rem' }}>
                            {[p.address, p.phone].filter(Boolean).join('  ·  ')}
                        </p>
                    )}
                    <p className="mt-6" style={{ color: 'var(--menu-muted)', fontSize: '0.75rem' }}>
                        © {new Date().getFullYear()} {p.name} · Powered by AxiomGroup
                    </p>
                </div>
            </footer>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const VenueLandingPage: React.FC = () => {
    const { loading, categoriesMap } = useData();
    const styles = usePreviewStyles(); // merged con draftTheme quando dentro iframe preview
    const { localname } = useParams<{ localname: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tableId = searchParams.get('table');
        if (tableId) navigate(`/${localname}/Categories?table=${tableId}`, { replace: true });
    }, [searchParams, navigate, localname]);

    if (loading) return <CustomLoading />;

    const eff: any = styles || {};
    const def = getTemplateDef(eff.landingTemplate);

    const name        = eff.restaurantName || localname || 'Ristorante';
    const heroImg     = eff.heroImageUrl && eff.heroImageUrl !== 'DELETE' ? (eff.heroImageUrl.startsWith?.('blob:') ? eff.heroImageUrl : resolveImageUrl(eff.heroImageUrl, '')) : '';
    const logoImg     = eff.logoUrl && eff.logoUrl !== 'DELETE' ? (eff.logoUrl.startsWith?.('blob:') ? eff.logoUrl : resolveImageUrl(eff.logoUrl, '')) : '';

    let rawFeatures = eff.features;
    if (typeof rawFeatures === 'string') {
        try { rawFeatures = JSON.parse(rawFeatures); } catch { rawFeatures = undefined; }
    }
    const features: FeatureCard[] = (rawFeatures as FeatureCard[] | undefined)?.length ? rawFeatures as FeatureCard[] : DEFAULT_FEATURE_CARDS;

    const categories = Array.from(categoriesMap.values()).filter(c => c.available);

    // backgroundGradient può arrivare come array (state in memoria) o come stringa "a;b;c"
    // (da backend). Con un solo colore il fondo lo gestiscono i token del tema.
    let bgArr: string[] = [];
    const bgRaw: any = eff.backgroundGradient;
    if (Array.isArray(bgRaw)) bgArr = bgRaw.filter(Boolean);
    else if (typeof bgRaw === 'string' && bgRaw) bgArr = bgRaw.split(';').filter(Boolean);
    const pageBgGradient = bgArr.length > 1 ? `linear-gradient(to bottom, ${bgArr.join(', ')})` : null;

    const heroBgColor = eff.heroBgColor || def.palette.heroBg;
    const heroOverlayOpacity = typeof eff.heroOverlayOpacity === 'number'
        ? Math.max(0, Math.min(1, eff.heroOverlayOpacity))
        : def.palette.heroOverlay;

    // Navigazione interna abilitata anche dentro l'iframe: così dalla preview puoi
    // cliccare "Sfoglia il menù" e atterrare su /Categories / Products mantenendo lo
    // stesso draftTheme via postMessage (vedi MenuThemeProvider + usePreviewStyles).
    const goToMenu     = () => navigate(`/${localname}/Categories`);
    const goToTakeaway = () => { localStorage.removeItem('rf_table_id'); navigate(`/${localname}/Categories`); };
    const scrollTo     = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    const landingProps: LandingProps = {
        name,
        heroImg,
        logoImg,
        description: (eff.description as string) || '',
        hours: (eff.openingHours as string) || '',
        whatsapp: (eff.whatsapp as string) || '',
        tiktokUrl: (eff.tiktokUrl as string) || '',
        categories,
        features,
        sectionMenuTitle: eff.sectionMenuTitle || '',
        sectionBookingTitle: eff.sectionBookingTitle || '',
        sectionWhyTitle: eff.sectionWhyTitle || '',
        showWhyUs: eff.showWhyUs ?? true,
        showBooking: eff.showBooking ?? true,
        showTicker: eff.showTicker ?? true,
        localname: localname || '',
        address: eff.address || '',
        phone: eff.phone || '',
        instagramUrl: eff.instagramUrl || '',
        facebookUrl: eff.facebookUrl || '',
        pageBgGradient,
        heroBgColor,
        heroOverlayOpacity,
        goToMenu,
        goToTakeaway,
        scrollTo,
        navigate,
    };

    // Sito a sezioni se il locale ne ha salvato uno valido; altrimenti il sito classico di sempre.
    const config = parseLandingConfig(eff.landingConfig);
    if (config) return <SectionsLanding {...landingProps} config={config} />;
    return <TemplateLanding {...landingProps} />;
};

export default VenueLandingPage;
