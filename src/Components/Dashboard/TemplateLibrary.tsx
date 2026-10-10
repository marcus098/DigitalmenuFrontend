import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { StyleDto } from '../../types';
import {
    MENU_TEMPLATES, MenuTemplateDef, VENUE_FILTERS, VenueTag,
    buildTemplateFontsHref, resolveTemplateKey,
} from '../../Client/menuTemplates';
import { getMenuTokens, tokensToCssVars, TEMPLATE_FONT_KEY } from '../../Client/menuTheme';

/**
 * Libreria template (Dashboard → Personalizza Aspetto → Template).
 *
 * Ogni scheda mostra un'anteprima in miniatura disegnata in CSS con la palette
 * e i font veri del template, così il ristoratore vede subito la differenza
 * tra "Trattoria", "Pub", "Cocktail bar"… senza aprire l'anteprima completa.
 */

const VENUE_LABEL: Record<VenueTag, string> = Object.fromEntries(
    VENUE_FILTERS.filter(v => v.key !== 'all').map(v => [v.key, v.label]),
) as Record<VenueTag, string>;

const SAMPLE_DISHES: [string, string][] = [
    ['Tagliatelle al ragù', '12'],
    ['Burrata e pomodorini', '9'],
    ['Tiramisù della casa', '6'],
];

// ─── Miniatura ────────────────────────────────────────────────────────────────

const TemplateThumb: React.FC<{ def: MenuTemplateDef }> = ({ def }) => {
    const vars = useMemo(
        () => tokensToCssVars(getMenuTokens({ landingTemplate: def.key } as StyleDto)) as React.CSSProperties,
        [def.key],
    );
    const l = def.look;
    const centered = l.align === 'center';
    const p = def.palette;

    const rule = (
        <div className={`menu-rule menu-rule--${l.divider}`} style={{ margin: '6px 0', transform: l.divider === 'checker' ? 'scaleY(0.6)' : undefined }}>
            {l.divider === 'ornament' && <i />}
        </div>
    );

    const title = (
        <div className="menu-h" style={{ fontSize: 17, lineHeight: 1, textAlign: centered ? 'center' : 'left', color: l.hero === 'overlay' ? '#fff' : undefined }}>
            Da Mario
        </div>
    );

    let dishes: React.ReactNode;
    if (l.productLayout === 'cards') {
        dishes = (
            <div style={{ display: 'grid', gap: 5 }}>
                {SAMPLE_DISHES.slice(0, 2).map(([n, pr]) => (
                    <div
                        key={n}
                        style={{
                            display: 'flex', gap: 6, alignItems: 'stretch', background: 'var(--menu-card)',
                            border: l.cardBorder === 'heavy' ? '1.5px solid var(--menu-text)' : '1px solid var(--menu-border)',
                            borderRadius: Math.min(l.radius, 6), overflow: 'hidden',
                            boxShadow: l.offsetShadow ? '2px 2px 0 var(--menu-text)' : 'none',
                        }}
                    >
                        <div style={{ width: 26, background: p.secondary, opacity: 0.85 }} />
                        <div style={{ padding: '4px 4px 4px 0', flex: 1, minWidth: 0 }}>
                            <div className="menu-h" style={{ fontSize: 9.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
                            <span
                                className="menu-price"
                                style={{
                                    fontSize: 8.5, fontWeight: 700, marginTop: 2, display: 'inline-block',
                                    ...(l.price === 'badge'
                                        ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)', padding: '0 3px' }
                                        : { color: 'var(--menu-emph)' }),
                                }}
                            >
                                €{pr}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    } else if (l.productLayout === 'centered') {
        dishes = (
            <div style={{ textAlign: 'center' }}>
                {SAMPLE_DISHES.slice(0, 2).map(([n, pr]) => (
                    <div key={n} style={{ marginBottom: 6 }}>
                        <div className="menu-h" style={{ fontSize: 10.5, lineHeight: 1.1 }}>{n}</div>
                        <div className="menu-price" style={{ fontSize: 8, color: 'var(--menu-emph)', letterSpacing: '0.1em', marginTop: 1 }}>{pr}</div>
                    </div>
                ))}
            </div>
        );
    } else {
        dishes = (
            <div>
                {SAMPLE_DISHES.map(([n, pr], i) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'baseline', padding: '2.5px 0', fontSize: 9.5 }}>
                        {l.productNumbers && (
                            <span className="menu-price" style={{ fontSize: 8, color: 'var(--menu-emph)', marginRight: 4 }}>{String(i + 1).padStart(2, '0')}</span>
                        )}
                        <span className="menu-h" style={{ fontSize: 10, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{n}</span>
                        {l.leaders
                            ? <span className="menu-leader" style={{ borderBottomWidth: 1.5, margin: '0 3px', minWidth: 6 }} />
                            : <span style={{ flex: 1, minWidth: 6 }} />}
                        <span className="menu-price" style={{ fontSize: 9, fontWeight: 600, color: l.price === 'accent' ? 'var(--menu-emph)' : 'var(--menu-text)' }}>{pr}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div data-menu-texture={l.texture} style={vars} aria-hidden="true">
            <div
                className="menu-page"
                style={{ height: 150, overflow: 'hidden', position: 'relative', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)' }}
            >
                {l.hero === 'overlay' ? (
                    <div style={{ background: p.heroBg, padding: '18px 10px 8px', backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(0,0,0,0.25))' }}>
                        {title}
                    </div>
                ) : (
                    <div style={{ padding: '12px 10px 0' }}>{title}</div>
                )}
                <div style={{ padding: '2px 10px 0' }}>
                    {rule}
                    <div className="menu-label" style={{ fontSize: 7, letterSpacing: '0.18em', textAlign: centered ? 'center' : 'left', color: 'var(--menu-emph)', marginBottom: 3 }}>
                        Primi piatti
                    </div>
                    {dishes}
                </div>
            </div>
        </div>
    );
};

// ─── Libreria ─────────────────────────────────────────────────────────────────

interface TemplateLibraryProps {
    draftTheme: StyleDto;
    updateThemeValue: (k: keyof StyleDto | string, v: any) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ draftTheme, updateThemeValue }) => {
    const [filter, setFilter] = useState<VenueTag | 'all'>('all');
    const [applyPalette, setApplyPalette] = useState(true);
    const current = resolveTemplateKey((draftTheme as any).landingTemplate);

    // Carica i font di tutti i template per le miniature (solo in questa scheda).
    useEffect(() => {
        const id = 'template-library-fonts';
        if (document.getElementById(id)) return;
        const href = buildTemplateFontsHref(MENU_TEMPLATES);
        if (!href) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, []);

    const list = filter === 'all' ? MENU_TEMPLATES : MENU_TEMPLATES.filter(t => t.venues.includes(filter));

    const choose = (def: MenuTemplateDef) => {
        updateThemeValue('landingTemplate', def.key);
        if (!applyPalette) return;
        const pl = def.palette;
        updateThemeValue('backgroundGradient', [pl.bg]);
        updateThemeValue('cardBackground', pl.card);
        updateThemeValue('primary', pl.accent);
        updateThemeValue('textOnPrimary', pl.accentText);
        updateThemeValue('textTitle', pl.text);
        updateThemeValue('textBody', pl.muted);
        updateThemeValue('secondaryColor', pl.secondary);
        updateThemeValue('secondaryTextColor', pl.secondaryText);
        updateThemeValue('heroBgColor', pl.heroBg);
        updateThemeValue('heroOverlayOpacity', pl.heroOverlay);
        updateThemeValue('font', TEMPLATE_FONT_KEY);
        updateThemeValue('cardStyle', 'soft');
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Libreria template</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Il template decide tipografia, impaginazione del menu e sito vetrina. Testi, foto e piatti restano gli stessi.
                </p>
            </div>

            <label className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border cursor-pointer">
                <input
                    type="checkbox"
                    checked={applyPalette}
                    onChange={e => setApplyPalette(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span>
                    <span className="block text-sm font-semibold text-gray-700">Usa anche colori e font del template</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                        Sostituisce i colori del tab "Colori" con quelli del template. Toglilo per tenere i tuoi colori.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtra per tipo di locale">
                {VENUE_FILTERS.map(v => {
                    const active = filter === v.key;
                    return (
                        <button
                            key={v.key}
                            type="button"
                            onClick={() => setFilter(v.key)}
                            aria-pressed={active}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                                active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {v.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                {list.map(def => {
                    const selected = current === def.key;
                    return (
                        <button
                            key={def.key}
                            type="button"
                            onClick={() => choose(def)}
                            aria-pressed={selected}
                            className={`text-left p-2 rounded-lg border-2 transition-colors bg-white ${
                                selected ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <TemplateThumb def={def} />
                            <div className="px-1 pt-2.5 pb-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-sm text-gray-900">{def.label}</p>
                                    {selected && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900">
                                            <Check className="w-3.5 h-3.5" /> In uso
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-0.5">
                                    {def.venues.map(v => VENUE_LABEL[v]).join(' · ')}
                                </p>
                                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{def.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplateLibrary;
