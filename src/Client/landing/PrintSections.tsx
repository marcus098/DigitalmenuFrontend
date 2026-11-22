import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { MenuTokens } from '../menuTheme';
import type { CategoryDto, ProductDto } from '../../types';
import { formatIndex } from '../menuTemplates';
import { MenuDescription, MenuMastheadTitle, MenuNumber, MenuPrice, MenuRule } from '../../Components/Client/MenuPrimitives';

/**
 * Impaginazioni "da stampa" del sito a sezioni (dicembre 2026). Ognuna nasce da un oggetto vero:
 * il manifesto svizzero, il cartoncino del menu, la lavagna dell'osteria, il biglietto scritto
 * a mano, il provino a contatto, le polaroid sul bancone. Niente schede arrotondate con ombra,
 * niente sfumature: carta, inchiostro e la griglia del template (token di useMenuLook()).
 */

export interface PrintImage { url: string; alt: string; caption?: string }

const visibleCats = (cats: CategoryDto[]) => cats.filter(c => c.id > 0 && c.available);
const priceOf = (pr: ProductDto) => (pr.options?.length ? pr.options[0].price : 0);
const hasMany = (pr: ProductDto) => (pr.options?.length || 0) > 1;

// ─── Intestazioni ────────────────────────────────────────────────────────────

interface HeroBase {
    id: string;
    t: MenuTokens;
    title: string;
    subtitle: string;
    facts: string[];
    image?: PrintImage;
    ctas: React.ReactNode;
    reveal?: string;
    logo?: string;
}

/** Manifesto tipografico: nome enorme a bandiera, fatti in colonne, foto ritagliata e sfalsata. */
export const HeroPoster: React.FC<HeroBase> = ({ id, t, title, subtitle, facts, image, ctas, reveal }) => {
    const riso = t.look.ink === 'misregister';
    return (
        <section id={`sec-${id}`} className="lp-poster">
            <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-14 pb-12 md:pb-20" data-reveal={reveal}>
                <MenuRule />
                {facts.length > 0 && (
                    <dl className="lp-poster-facts">
                        {facts.map((f, i) => (
                            <div key={i}>
                                <dt className="sr-only">{i === 0 ? 'Indirizzo' : 'Orari'}</dt>
                                <dd>{f}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                <div className="lp-poster-grid">
                    <div className="lp-poster-main">
                        <h1 className="menu-h lp-poster-title">{title}</h1>
                        {subtitle && <p className="lp-poster-sub">{subtitle}</p>}
                        {ctas}
                    </div>
                    {image && (
                        <figure className="lp-poster-figure">
                            <div className={`lp-poster-photo ${riso ? 'lp-duotone' : ''}`}>
                                <img src={image.url} alt={image.alt} />
                            </div>
                            {image.alt && <figcaption>{image.alt}</figcaption>}
                        </figure>
                    )}
                </div>
            </div>
        </section>
    );
};

/** Il cartoncino del menu appoggiato sul tavolo: testata, fregio, sezioni del menù numerate. */
export const HeroCard: React.FC<HeroBase & { categories: CategoryDto[]; onCategory: (id: number) => void }> = ({
    id, t, title, subtitle, facts, image, ctas, reveal, categories, onCategory, logo,
}) => {
    const cats = visibleCats(categories).slice(0, 8);
    const numbers = t.look.categoryNumbers === 'none' ? 'roman' : t.look.categoryNumbers;
    return (
        <section id={`sec-${id}`} className="lp-cardhero">
            <div className={`max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-16 grid gap-8 md:gap-0 items-start ${image ? 'md:grid-cols-12' : ''}`}>
                {image && (
                    <figure className="lp-cardhero-photo md:col-span-6 md:row-start-1 md:col-start-1">
                        <img src={image.url} alt={image.alt} />
                    </figure>
                )}
                <div
                    data-reveal={reveal}
                    className={`lp-menucard ${image ? 'md:col-span-6 md:col-start-6 md:row-start-1 md:mt-16' : 'max-w-xl mx-auto w-full'}`}
                >
                    {logo && <img src={logo} alt="" className="w-14 h-14 object-cover mx-auto mb-4" style={{ borderRadius: 'var(--menu-radius)' }} />}
                    {facts.length > 0 && <p className="lp-menucard-facts">{facts.join(' · ')}</p>}
                    <div className="mt-3">
                        {t.look.headerStyle === 'plain'
                            ? <h1 className="menu-h text-center" style={{ fontSize: 'clamp(2.4rem, 9vw, 4.2rem)', lineHeight: 0.98 }}>{title}</h1>
                            : <MenuMastheadTitle name={title} fontSize="clamp(2.2rem, 8vw, 3.8rem)" centered />}
                    </div>
                    <MenuRule className="my-6 mx-auto" style={{ maxWidth: 280 }} />
                    {subtitle && <p className="lp-menucard-sub">{subtitle}</p>}
                    {cats.length > 0 && (
                        <nav aria-label="Il menù" className="mt-7">
                            <ol className="lp-menucard-list">
                                {cats.map((c, i) => (
                                    <li key={c.id}>
                                        <button type="button" onClick={() => onCategory(c.id)} className="menu-focus menu-row">
                                            <span className="lp-menucard-num" aria-hidden="true">{formatIndex(i + 1, numbers)}</span>
                                            <span className="menu-h lp-menucard-name">{c.name}</span>
                                            <span className="menu-leader" aria-hidden="true" />
                                            <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" style={{ color: 'var(--menu-emph)' }} />
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}
                    <div className="lp-menucard-ctas">{ctas}</div>
                </div>
            </div>
        </section>
    );
};

/** La lavagna (o la bacheca a lettere) all'ingresso: le voci del menù scritte sopra, foto appuntata a lato. */
export const HeroBoard: React.FC<HeroBase & { categories: CategoryDto[]; onCategory: (id: number) => void; hours: string }> = ({
    id, t, title, subtitle, facts, image, ctas, reveal, categories, onCategory, hours,
}) => {
    const cats = visibleCats(categories).slice(0, 9);
    const felt = t.look.texture === 'felt';
    return (
        <section id={`sec-${id}`} className="lp-boardhero">
            <div className={`max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14 grid gap-10 ${image ? 'md:grid-cols-12' : ''} items-start`}>
                <div data-reveal={reveal} className={`lp-board ${felt ? 'lp-board--felt' : ''} ${image ? 'md:col-span-7' : 'max-w-2xl mx-auto w-full'}`}>
                    {facts.length > 0 && <p className="lp-board-facts">{facts[0]}</p>}
                    <h1 className="menu-h lp-board-title">{title}</h1>
                    {subtitle && <p className="lp-board-sub">{subtitle}</p>}
                    {cats.length > 0 && (
                        <>
                            <p className="menu-h lp-board-today">{felt ? 'Oggi in banco' : 'Oggi in cucina'}</p>
                            <ul className="lp-board-list">
                                {cats.map(c => (
                                    <li key={c.id}>
                                        <button type="button" onClick={() => onCategory(c.id)} className="menu-focus">
                                            <span aria-hidden="true">{felt ? '·' : '—'}</span> {c.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <div className="lp-board-ctas">{ctas}</div>
                </div>
                {image && (
                    <div className="md:col-span-5 md:pt-10">
                        <figure className="lp-pinned">
                            <img src={image.url} alt={image.alt} />
                        </figure>
                        {hours && (
                            <p className="lp-pinned-note">
                                <span className="menu-h">Orari</span>
                                <br />
                                {hours}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Chi siamo ───────────────────────────────────────────────────────────────

/** Editoriale: foto larga in apertura, titolo a sinistra, testo in colonna stretta con capolettera. */
export const AboutEditorial: React.FC<{ title: string; eyebrow: string; text: string; image?: PrintImage }> = ({ title, eyebrow, text, image }) => {
    const paras = text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    return (
        <div className="lp-editorial">
            {image && (
                <figure className="lp-item lp-editorial-figure">
                    <img src={image.url} alt={image.alt} loading="lazy" />
                    {image.alt && <figcaption>{image.alt}</figcaption>}
                </figure>
            )}
            <div className="lp-editorial-grid">
                <div className="lp-item">
                    {eyebrow && <p className="lp-eyebrow">{eyebrow}</p>}
                    {title && <h2 className="menu-h lp-editorial-title">{title}</h2>}
                </div>
                <div className="lp-item lp-editorial-text" style={{ ['--i' as any]: 1 }}>
                    {paras.map((p, i) => <p key={i} className={i === 0 ? 'lp-dropcap' : ''}>{p}</p>)}
                </div>
            </div>
        </div>
    );
};

/** Biglietto scritto a mano fermato col nastro, con la foto appuntata accanto. */
export const AboutNote: React.FC<{ title: string; text: string; image?: PrintImage; signature: string }> = ({ title, text, image, signature }) => {
    const paras = text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    return (
        <div className={`grid gap-10 items-start ${image ? 'md:grid-cols-12' : ''}`}>
            <div className={`lp-item lp-note ${image ? 'md:col-span-7' : 'max-w-xl mx-auto'}`}>
                {title && <h2 className="menu-h lp-note-title">{title}</h2>}
                {paras.map((p, i) => <p key={i}>{p}</p>)}
                <p className="lp-note-sign">— {signature}</p>
            </div>
            {image && (
                <figure className="lp-item lp-pinned lp-pinned--right md:col-span-5 md:mt-12" style={{ ['--i' as any]: 1 }}>
                    <img src={image.url} alt={image.alt} loading="lazy" />
                    {image.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
            )}
        </div>
    );
};

// ─── Galleria ────────────────────────────────────────────────────────────────

/** Provino a contatto: striscia di pellicola con le perforazioni e i numeri dei fotogrammi. */
export const GalleryFilmstrip: React.FC<{ items: PrintImage[]; label: string }> = ({ items, label }) => (
    <div className="lp-film" role="region" aria-label={label} tabIndex={0}>
        <div className="lp-film-track">
            {items.map((im, i) => (
                <figure key={i} className="lp-item lp-film-frame" style={{ ['--i' as any]: i }}>
                    <img src={im.url} alt={im.alt} loading="lazy" />
                    <figcaption>
                        <span aria-hidden="true">{String(i + 1).padStart(2, '0')}A ▸</span>
                        {im.caption ? ` ${im.caption}` : ''}
                    </figcaption>
                </figure>
            ))}
        </div>
    </div>
);

/** Collage editoriale: una foto grande, due piccole impilate, didascalie numerate sotto. */
export const GalleryCollage: React.FC<{ items: PrintImage[] }> = ({ items }) => {
    const captions = items.map((im, i) => ({ n: i + 1, text: im.caption || im.alt })).filter(c => c.text);
    return (
        <>
            <div className="lp-collage">
                {items.map((im, i) => (
                    <figure key={i} className={`lp-item lp-collage-${i < 3 ? i : 'x'}`} style={{ ['--i' as any]: i }}>
                        <img src={im.url} alt={im.alt} loading="lazy" />
                        <span className="lp-collage-n" aria-hidden="true">{i + 1}</span>
                    </figure>
                ))}
            </div>
            {captions.length > 0 && (
                <ol className="lp-collage-captions">
                    {captions.map(c => <li key={c.n}><b>{c.n}</b> {c.text}</li>)}
                </ol>
            )}
        </>
    );
};

// ─── Piatti in evidenza ──────────────────────────────────────────────────────

interface HiProps { list: ProductDto[]; showPrices: boolean; open: (pr: ProductDto) => void; img: (src?: string | null) => string; t: MenuTokens }

/** Menù stampato su due colonne: nome, puntini, prezzo, descrizione nello stile del template. */
export const HighlightsMenu: React.FC<HiProps> = ({ list, showPrices, open, t }) => (
    <ul className="lp-printmenu">
        {list.map((pr, i) => (
            <li key={pr.id} className="lp-item" style={{ ['--i' as any]: i }}>
                <button type="button" onClick={() => open(pr)} className="menu-focus menu-row lp-printmenu-row">
                    {t.look.productNumbers && <MenuNumber n={i + 1} className="flex-shrink-0" style={{ minWidth: '1.7rem' }} />}
                    <span className="flex-1 min-w-0">
                        <span className="flex items-baseline">
                            <span className="menu-h lp-printmenu-name">{pr.name}</span>
                            {showPrices && (t.look.pricePosition === 'inline'
                                ? <span className="ml-3"><MenuPrice value={priceOf(pr)} from={hasMany(pr)} /></span>
                                : <>{t.look.leaders ? <span className="menu-leader" /> : <span className="flex-1" />}<MenuPrice value={priceOf(pr)} from={hasMany(pr)} /></>)}
                        </span>
                        {pr.description && <MenuDescription text={pr.description} className="mt-1" style={{ fontSize: '0.92rem', lineHeight: 1.5 }} />}
                    </span>
                </button>
            </li>
        ))}
    </ul>
);

/** Polaroid sparse sul bancone, ognuna un po' storta, nome scritto sotto. */
export const HighlightsPolaroid: React.FC<HiProps> = ({ list, showPrices, open, img }) => (
    <ul className="lp-polaroids">
        {list.map((pr, i) => {
            const u = img(pr.image);
            return (
                <li key={pr.id} className="lp-item" style={{ ['--i' as any]: i }}>
                    <button type="button" onClick={() => open(pr)} className="menu-focus lp-polaroid">
                        <span className="lp-polaroid-photo">{u ? <img src={u} alt="" loading="lazy" /> : null}</span>
                        <span className="menu-h lp-polaroid-name">{pr.name}</span>
                        {showPrices && <span className="lp-polaroid-price"><MenuPrice value={priceOf(pr)} from={hasMany(pr)} /></span>}
                    </button>
                </li>
            );
        })}
    </ul>
);

/** Indice svizzero: numero grande, nome, descrizione, prezzo in colonna, filetto pieno per riga. */
export const HighlightsIndex: React.FC<HiProps> = ({ list, showPrices, open }) => (
    <ol className="lp-index">
        {list.map((pr, i) => (
            <li key={pr.id} className="lp-item" style={{ ['--i' as any]: i }}>
                <button type="button" onClick={() => open(pr)} className="menu-focus menu-row lp-index-row">
                    <span className="menu-h lp-index-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="lp-index-body">
                        <span className="menu-h lp-index-name">{pr.name}</span>
                        {pr.description && <span className="lp-index-desc">{pr.description}</span>}
                    </span>
                    {showPrices && <span className="lp-index-price"><MenuPrice value={priceOf(pr)} from={hasMany(pr)} size="1.2rem" /></span>}
                </button>
            </li>
        ))}
    </ol>
);
