import React from 'react';
import type { MenuTokens } from '../../../Client/menuTheme';
import { formatIndex } from '../../../Client/menuTemplates';
import { allergenName, menuText } from '../../../Client/menuI18n';
import { allergenById, allergens as ALLERGENS } from '../../../Utilities/Utilities';
import { MenuLookProvider } from '../../Client/MenuThemeProvider';
import {
    formatEuro, imageRadius, MenuDescription, MenuMastheadTitle, MenuNumber, MenuPrice, MenuRule, MenuSectionHeading,
} from '../../Client/MenuPrimitives';
import type { AllergenStyle, PdfCategory, PdfMenuData, PdfProduct } from './menuPdfModel';

/**
 * Menu stampabile (A4) nello stile del template: stessi token, font, filetti, testate e titoli di
 * sezione del menu pubblico. Renderizzato in HTML statico (renderToStaticMarkup) e stampato in PDF
 * dal browser: vedi buildMenuPrintHtml.ts. Ogni piatto è un blocco `.pdf-item` che non si spezza
 * tra due pagine.
 */

export interface MenuPrintDocumentProps {
    tokens: MenuTokens;
    menu: PdfMenuData;
    venueName: string;
    /** Indirizzo · telefono sotto il nome. */
    venueSub?: string;
    logoUrl?: string;
    heroBg: string;
    allergenStyle: AllergenStyle;
    /** Allergeni e legenda (default sì). */
    showAllergens?: boolean;
    /** Colonne dell'elenco piatti: assente = come l'impaginazione del template. */
    columns?: 1 | 2;
    lang: string;
    imageBase: string;
}

const TAG_LABELS: Record<number, string> = { 1: 'Vegetariano', 2: 'Senza glutine', 3: 'Piccante', 4: 'Classico della casa' };

const signedEuro = (v: number) => `${v < 0 ? '−' : '+'}${formatEuro(Math.abs(v))} €`;

const allergenLabel = (id: number, lang: string, short: boolean) =>
    allergenName(id, lang, short) ?? (short ? allergenById.get(id)?.short : allergenById.get(id)?.name) ?? String(id);

// ─── Pezzi del piatto ────────────────────────────────────────────────────────

const SoldOutMark: React.FC<{ lang: string }> = ({ lang }) => (
    <span
        style={{
            fontFamily: 'var(--menu-font-body)', fontSize: '6.8pt', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontStyle: 'normal', verticalAlign: 'middle', marginLeft: '0.6em',
            padding: '0.5pt 4pt', border: '0.75pt solid currentColor', borderRadius: 2, color: 'var(--menu-muted)',
            whiteSpace: 'nowrap',
        }}
    >
        {menuText('soldOut', lang)}
    </span>
);

/** Prezzo singolo nello stile del template, oppure i formati ("Piccola 6 · Grande 9"). */
const PriceBlock: React.FC<{ product: PdfProduct; align?: 'left' | 'center' | 'right'; size?: string }> = ({ product, align = 'left', size = '11pt' }) => {
    if (product.prices.length === 0) return null;
    if (product.prices.length === 1 && !product.prices[0].label) return <MenuPrice value={product.prices[0].price} size={size} />;
    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '2pt 9pt', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
            {product.prices.map((p, i) => (
                <span key={i} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'baseline', gap: '3pt' }}>
                    {p.label && (
                        <span style={{ fontFamily: 'var(--menu-font-body)', fontSize: '7.6pt', color: 'var(--menu-muted)', fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                            {p.label}
                        </span>
                    )}
                    <MenuPrice value={p.price} size={`calc(${size} * 0.9)`} />
                </span>
            ))}
        </span>
    );
};

/** Riga piccola: varianti, allergeni, tracce, caratteristiche. */
const Details: React.FC<{ product: PdfProduct; allergenStyle: AllergenStyle; lang: string; align?: 'left' | 'center' }> = ({ product, allergenStyle, lang, align = 'left' }) => {
    const small: React.CSSProperties = {
        fontFamily: 'var(--menu-font-body)', fontSize: '7.6pt', lineHeight: 1.45, color: 'var(--menu-muted)',
        textAlign: align, margin: '2pt 0 0', fontStyle: 'normal',
    };
    const tags = lang === 'it' ? product.tags.map(t => TAG_LABELS[t]).filter(Boolean) : [];
    const allergenText = allergenStyle === 'numbers'
        ? product.allergens.join(', ')
        : product.allergens.map(id => allergenLabel(id, lang, true)).join(' · ');
    const traceText = allergenStyle === 'numbers'
        ? product.traces.join(', ')
        : product.traces.map(id => allergenLabel(id, lang, true).toLowerCase()).join(', ');
    return (
        <>
            {product.variants.map((g, i) => (
                <p key={i} style={{ ...small, color: 'var(--menu-text)', opacity: 0.85 }}>
                    <span style={{ fontWeight: 700 }}>{g.name}:</span>{' '}
                    {g.choices.map((c, j) => (
                        <React.Fragment key={j}>
                            {j > 0 && <span style={{ opacity: 0.6 }}> · </span>}
                            <span style={{ textDecoration: c.soldOut ? 'line-through' : undefined }}>{c.name}</span>
                            {c.delta !== 0 && <span className="menu-price" style={{ fontWeight: 600, color: 'var(--menu-emph)' }}> {signedEuro(c.delta)}</span>}
                        </React.Fragment>
                    ))}
                </p>
            ))}
            {tags.length > 0 && (
                <p style={{ ...small, fontSize: '7.8pt', fontWeight: 600, fontStyle: 'italic', color: 'var(--menu-emph)' }}>
                    {tags.join(' · ')}
                </p>
            )}
            {(product.allergens.length > 0 || product.traces.length > 0) && (
                <p style={small}>
                    {product.allergens.length > 0 && (
                        <>
                            <span style={{ fontWeight: 700 }}>{menuText('allergens', lang)}:</span> {allergenText}
                        </>
                    )}
                    {product.allergens.length > 0 && product.traces.length > 0 && <span> — </span>}
                    {product.traces.length > 0 && (
                        <span style={{ fontStyle: 'italic' }}>{menuText('mayContainTraces', lang).toLowerCase()} {traceText}</span>
                    )}
                </p>
            )}
        </>
    );
};

interface ItemProps {
    product: PdfProduct;
    index: number;
    tokens: MenuTokens;
    allergenStyle: AllergenStyle;
    lang: string;
    imageBase: string;
}

const Name: React.FC<{ product: PdfProduct; lang: string; size: string; align?: 'left' | 'center'; extra?: React.CSSProperties; children?: React.ReactNode }> = ({ product, lang, size, align = 'left', extra, children }) => (
    <h3 className="menu-h" style={{ fontSize: size, lineHeight: 1.2, textAlign: align, margin: 0, ...extra }}>
        {product.name}
        {product.frozen && <span style={{ color: 'var(--menu-muted)', marginLeft: 2 }}>*</span>}
        {children}
        {product.soldOut && <SoldOutMark lang={lang} />}
    </h3>
);

const Thumb: React.FC<{ src: string; tokens: MenuTokens; w: string; h: string; style?: React.CSSProperties }> = ({ src, tokens, w, h, style }) => (
    <div style={{ width: w, height: h, flex: '0 0 auto', overflow: 'hidden', borderRadius: imageRadius(tokens.look.imageShape), background: 'var(--menu-surface)', ...style }}>
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
);

const rowPad = (tokens: MenuTokens) => tokens.look.density === 'compact' ? 4.5 : tokens.look.density === 'airy' ? 10 : 7;

/** Riga da menu stampato: nome · puntini · prezzo, descrizione sotto. */
const RowItem: React.FC<ItemProps & { narrow?: boolean }> = ({ product, index, tokens, allergenStyle, lang, imageBase, narrow }) => {
    const l = tokens.look;
    // Più formati su mezza pagina: i prezzi vanno sotto, se no il nome si stringe troppo
    const pp = narrow && product.prices.length > 1 && l.pricePosition === 'right' ? 'below' : l.pricePosition;
    const pad = rowPad(tokens);
    const nameSize = l.density === 'compact' ? '11.2pt' : '12.2pt';
    return (
        <div className="pdf-item" style={{ display: 'flex', gap: '8pt', alignItems: 'flex-start', padding: `${pad}pt 1.5pt ${pad}pt 0`, opacity: product.soldOut ? 0.55 : 1 }}>
            {l.productNumbers && (
                <MenuNumber n={index} size="9pt" style={{ minWidth: '16pt', marginTop: l.numberStyle === 'boxed' ? 0 : '2pt', height: l.numberStyle === 'boxed' ? '15pt' : undefined }} />
            )}
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <Name
                        product={product}
                        lang={lang}
                        size={nameSize}
                        extra={{ minWidth: 0, ...(l.headingCase === 'uppercase' ? { letterSpacing: '0.05em' } : {}) }}
                    >
                        {pp === 'inline' && product.prices.length > 0 && (
                            <span style={{ marginLeft: '0.6em', fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                                <PriceBlock product={product} size="0.92em" />
                            </span>
                        )}
                    </Name>
                    {pp === 'right' && product.prices.length > 0 && (
                        <>
                            {l.leaders ? <span className="menu-leader" /> : <span style={{ flex: '1 1 auto', minWidth: '10pt' }} />}
                            <span style={{ flex: '0 1 auto', textAlign: 'right' }}><PriceBlock product={product} align="right" /></span>
                        </>
                    )}
                </div>
                {product.description && (
                    <MenuDescription text={product.description} style={{ fontSize: '8.8pt', lineHeight: 1.45, margin: '1.5pt 0 0' }} />
                )}
                <Details product={product} allergenStyle={allergenStyle} lang={lang} />
                {pp === 'below' && product.prices.length > 0 && <div style={{ marginTop: '3pt' }}><PriceBlock product={product} /></div>}
            </div>
            {product.image && <Thumb src={imageBase + product.image} tokens={tokens} w="46pt" h={l.imageShape === 'arch' ? '55pt' : '46pt'} />}
        </div>
    );
};

/** Fine dining: blocco centrato. */
const CenteredItem: React.FC<ItemProps> = ({ product, index, tokens, allergenStyle, lang, imageBase }) => (
    <div className="pdf-item pdf-item--block" style={{ textAlign: 'center', padding: `0 8% ${rowPad(tokens) + 5}pt` }}>
        {/* il filetto sta dentro il blocco: non resta mai da solo in fondo alla pagina */}
        {index > 1 ? <div style={{ padding: `0 22% ${rowPad(tokens) + 5}pt` }}><MenuRule /></div> : <div style={{ height: `${rowPad(tokens) + 5}pt` }} />}
        <div style={{ opacity: product.soldOut ? 0.55 : 1 }}>
        {product.image && <Thumb src={imageBase + product.image} tokens={tokens} w="60pt" h="60pt" style={{ margin: '0 auto 6pt' }} />}
        <Name product={product} lang={lang} size="14pt" align="center" />
        {product.description && (
            <MenuDescription text={product.description} autoItalic={false} style={{ fontSize: '9pt', lineHeight: 1.5, margin: '3pt 0 0', letterSpacing: '0.01em' }} />
        )}
        <Details product={product} allergenStyle={allergenStyle} lang={lang} align="center" />
        {product.prices.length > 0 && (
            <div style={{ marginTop: '5pt', letterSpacing: '0.08em' }}><PriceBlock product={product} align="center" size="10pt" /></div>
        )}
        </div>
    </div>
);

/** Scheda (layout "cards" e "grid"). */
const CardItem: React.FC<ItemProps & { vertical: boolean }> = ({ product, index, tokens, allergenStyle, lang, imageBase, vertical }) => {
    const l = tokens.look;
    const heavy = l.cardBorder === 'heavy';
    const tints = [
        'color-mix(in srgb, var(--menu-accent) 70%, var(--menu-card))',
        'var(--menu-secondary)',
        'color-mix(in srgb, var(--menu-secondary) 45%, var(--menu-card))',
    ];
    const img = product.image ? imageBase + product.image : null;
    return (
        // Il blocco esterno lascia spazio all'ombra sfalsata (contain: paint la taglierebbe)
        <div className="pdf-item" style={{ display: 'flex', padding: l.offsetShadow ? '0 3pt 3pt 0' : 0 }}>
        <div
            style={{
                flex: '1 1 auto', minWidth: 0,
                display: 'flex', flexDirection: vertical ? 'column' : 'row', overflow: 'hidden',
                background: 'var(--menu-card)', borderRadius: `min(${tokens.radius}, 10pt)`,
                border: heavy ? '1.5pt solid var(--menu-text)' : l.cardBorder === 'none' && vertical ? 'none' : '0.75pt solid var(--menu-border)',
                boxShadow: l.offsetShadow ? '3pt 3pt 0 var(--menu-text)' : 'none',
                opacity: product.soldOut ? 0.55 : 1,
            }}
        >
            {vertical ? (
                img ? (
                    <div style={{ padding: '6pt 6pt 0' }}>
                        <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: imageRadius(l.imageShape) }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                    </div>
                ) : <div style={{ height: '5pt', background: tints[(index - 1) % tints.length] }} />
            ) : (
                img
                    ? <Thumb src={img} tokens={{ ...tokens, look: { ...l, imageShape: 'square' } }} w="72pt" h="auto" style={{ alignSelf: 'stretch', minHeight: '72pt', borderRadius: 0, borderRight: heavy ? '1.5pt solid var(--menu-text)' : undefined }} />
                    : <div style={{ width: '6pt', flex: '0 0 auto', background: tints[(index - 1) % tints.length] }} />
            )}
            {l.productNumbers && !vertical && (
                <span className="menu-price" style={{ width: '24pt', flex: '0 0 auto', textAlign: 'center', paddingTop: '9pt', background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)', fontSize: '9pt', fontWeight: 700 }}>
                    {String(index).padStart(2, '0')}
                </span>
            )}
            <div style={{ flex: '1 1 auto', minWidth: 0, padding: l.density === 'compact' ? '7pt 8pt' : '9pt 10pt', display: 'flex', flexDirection: 'column' }}>
                {l.productNumbers && vertical && (
                    <span className="menu-price" style={{ color: 'var(--menu-emph)', fontSize: '8pt', fontWeight: 600 }}>{String(index).padStart(2, '0')}</span>
                )}
                <Name product={product} lang={lang} size={vertical ? '11pt' : '12pt'} />
                {product.description && (
                    <MenuDescription text={product.description} autoItalic={false} style={{ fontSize: '8.4pt', lineHeight: 1.4, margin: '2pt 0 0' }} />
                )}
                <Details product={product} allergenStyle={allergenStyle} lang={lang} />
                {product.prices.length > 0 && <div style={{ marginTop: 'auto', paddingTop: '5pt' }}><PriceBlock product={product} /></div>}
            </div>
        </div>
        </div>
    );
};

// ─── Categoria ───────────────────────────────────────────────────────────────

const CategorySection: React.FC<{
    category: PdfCategory;
    position: number;
    tokens: MenuTokens;
    allergenStyle: AllergenStyle;
    columns?: 1 | 2;
    lang: string;
    imageBase: string;
}> = ({ category, position, tokens, allergenStyle, columns, lang, imageBase }) => {
    const l = tokens.look;
    const centered = l.align === 'center';
    const number = formatIndex(position, l.categoryNumbers);
    const titleSize = '21pt';
    const items = category.products.map((p, i) => ({ product: p, index: i + 1 }));
    const common = { tokens, allergenStyle, lang, imageBase };

    let body: React.ReactNode;
    // Colonne forzate dal dialog: l'elenco "menu" su 2 colonne diventa "twocol" e viceversa
    const layout = columns === 2 && l.productLayout === 'menu' ? 'twocol'
        : columns === 1 && l.productLayout === 'twocol' ? 'menu'
        : l.productLayout;
    const gridCols = columns ?? (layout === 'grid' ? 3 : 2);
    switch (layout) {
        case 'grid':
            body = (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns === 1 ? 2 : gridCols}, minmax(0, 1fr))`, gap: '8pt', paddingTop: '6pt' }}>
                    {items.map(it => <CardItem key={it.product.id} {...it} {...common} vertical />)}
                </div>
            );
            break;
        case 'cards':
            body = (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns ?? 2}, minmax(0, 1fr))`, gap: '8pt', paddingTop: '6pt' }}>
                    {items.map(it => <CardItem key={it.product.id} {...it} {...common} vertical={false} />)}
                </div>
            );
            break;
        case 'centered':
            body = (
                <div className={columns === 2 ? 'pdf-cols' : undefined}>
                    {items.map(it => <CenteredItem key={it.product.id} {...it} {...common} />)}
                </div>
            );
            break;
        case 'twocol':
            body = (
                <div className="pdf-cols">
                    {items.map(it => <RowItem key={it.product.id} {...it} {...common} narrow />)}
                </div>
            );
            break;
        default:
            body = <div>{items.map(it => <RowItem key={it.product.id} {...it} {...common} />)}</div>;
    }

    return (
        <section className="pdf-category">
            <div className="pdf-cat-head" style={{ textAlign: centered ? 'center' : 'left', marginBottom: '6pt' }}>
                {number && l.sectionHeader !== 'seal' && (
                    <p className="menu-label" style={{ color: 'var(--menu-emph)', fontSize: '8pt', margin: '0 0 3pt' }}>{number}</p>
                )}
                {l.sectionHeader === 'plain' ? (
                    <h2 className="menu-h" style={{ fontSize: titleSize, textAlign: centered ? 'center' : 'left', margin: 0 }}>
                        {category.name}
                    </h2>
                ) : (
                    <MenuSectionHeading title={category.name} centered={centered} fontSize={titleSize} index={position} />
                )}
                {category.soldOut && <div style={{ marginTop: '4pt' }}><SoldOutMark lang={lang} /></div>}
                {category.description && (
                    <p style={{ color: 'var(--menu-muted)', fontSize: '9pt', lineHeight: 1.45, margin: `${l.sectionHeader === 'plain' ? 3 : 7}pt ${centered ? 'auto' : '0'} 0`, maxWidth: '125mm', fontStyle: l.headingStyle === 'italic' ? 'italic' : 'normal' }}>
                        {category.description}
                    </p>
                )}
                <MenuRule style={{ marginTop: '7pt' }} />
            </div>
            {body}
        </section>
    );
};

// ─── Documento ───────────────────────────────────────────────────────────────

const Masthead: React.FC<MenuPrintDocumentProps> = ({ tokens, venueName, venueSub, logoUrl, heroBg }) => {
    const l = tokens.look;
    const centered = l.align === 'center' || l.headerStyle !== 'plain';
    const logo = logoUrl ? (
        <img src={logoUrl} alt="" style={{ width: '58pt', height: '58pt', objectFit: 'cover', borderRadius: '50%', display: 'block', margin: centered ? '0 auto 10pt' : '0 0 10pt' }} />
    ) : null;
    const sub = venueSub ? <p className="menu-label" style={{ margin: '8pt 0 0', textAlign: centered ? 'center' : 'left', fontSize: '7.6pt' }}>{venueSub}</p> : null;

    // Template con la foto sotto il nome: nel PDF diventa una fascia col colore della hero.
    if (l.hero === 'overlay' && l.headerStyle === 'plain') {
        return (
            <header className="pdf-masthead" style={{ background: heroBg, padding: '22pt 18pt 18pt', borderRadius: `min(${tokens.radius}, 8pt)`, textAlign: centered ? 'center' : 'left', marginBottom: '16pt' }}>
                {logo}
                <h1 className="menu-h" style={{ fontSize: '32pt', lineHeight: 1, margin: 0, color: '#fff', textAlign: l.align }}>{venueName}</h1>
                {venueSub && <p className="menu-label" style={{ margin: '8pt 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '7.6pt', textAlign: l.align }}>{venueSub}</p>}
            </header>
        );
    }
    return (
        <header className="pdf-masthead" style={{ textAlign: centered ? 'center' : 'left', marginBottom: '16pt' }}>
            {logo}
            <MenuMastheadTitle name={venueName} fontSize="32pt" centered={centered} />
            {sub}
            <MenuRule style={{ marginTop: '12pt' }} />
        </header>
    );
};

const MenuPrintDocument: React.FC<MenuPrintDocumentProps> = (props) => {
    const { tokens, menu, allergenStyle, lang, imageBase, columns, showAllergens = true } = props;
    const centered = tokens.look.align === 'center';
    return (
        <MenuLookProvider tokens={tokens}>
            <Masthead {...props} />
            <main>
                {menu.categories.map((c, i) => (
                    <CategorySection key={c.id} category={c} position={i + 1} tokens={tokens} allergenStyle={allergenStyle} columns={columns} lang={lang} imageBase={imageBase} />
                ))}
            </main>
            <footer className="pdf-legend" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '7.4pt', lineHeight: 1.5, textAlign: centered ? 'center' : 'left' }}>
                <MenuRule style={{ marginBottom: '8pt' }} />
                {showAllergens && allergenStyle === 'numbers' && (
                    <>
                        <p style={{ margin: '0 0 3pt', fontWeight: 700, color: 'var(--menu-text)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '7pt' }}>
                            {menuText('allergens', lang)}
                        </p>
                        <ol className="pdf-legend-list">
                            {ALLERGENS.map(a => (
                                <li key={a.id}><span className="menu-price" style={{ fontWeight: 700, color: 'var(--menu-emph)' }}>{a.id}</span> {allergenLabel(a.id, lang, false)}</li>
                            ))}
                        </ol>
                    </>
                )}
                {menu.hasFrozen && <p style={{ margin: '4pt 0 0' }}>* {menuText('frozen', lang)}</p>}
                <p style={{ margin: '4pt 0 0', opacity: 0.85 }}>{menuText('allergenFooter', lang)}</p>
            </footer>
        </MenuLookProvider>
    );
};

export default MenuPrintDocument;
