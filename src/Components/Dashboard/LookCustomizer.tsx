import React, { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { StyleDto } from '../../types';
import {
    BUTTON_STYLES, buildTemplateFontsHref, CATEGORY_NAVS, DENSITIES, DIVIDERS, fontPairLabel, HEADER_STYLES, IMAGE_SHAPES,
    LookOverrides, MENU_TEMPLATES, parseTemplateValue, PRICE_POSITIONS, PRODUCT_LAYOUTS, RADIUS_STEPS, SECTION_HEADERS,
    serializeTemplateValue, TEMPLATE_BY_KEY, TEXTURES,
} from '../../Client/menuTemplates';
import { TEMPLATE_FONT_KEY } from '../../Client/menuTheme';

/**
 * Ritocchi del template (Dashboard → Personalizza aspetto → Layout).
 *
 * Ogni scelta parte da "Come da template" e, se cambiata, viene salvata nella stessa stringa
 * del template (`landingTemplate = "chiave|pl=grid;r=4"`, vedi menuTemplates.ts): nessun campo
 * nuovo lato backend, e i locali che non toccano nulla restano identici.
 */

interface Props {
    draftTheme: StyleDto;
    updateThemeValue: (k: keyof StyleDto | string, v: any) => void;
}

const RADIUS_LABEL: Record<number, string> = {
    0: 'Squadrati (0 px)', 2: 'Appena smussati (2 px)', 6: 'Morbidi (6 px)', 12: 'Arrotondati (12 px)', 20: 'Molto arrotondati (20 px)',
};

const Select: React.FC<{
    label: string;
    hint?: string;
    value: string;
    templateLabel: string;
    options: { key: string; label: string }[];
    onChange: (v: string) => void;
    style?: React.CSSProperties;
}> = ({ label, hint, value, templateLabel, options, onChange, style }) => (
    <div>
        <label className="label-style text-sm">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="input-style mt-1" style={style}>
            <option value="">Come da template — {templateLabel}</option>
            {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
);

const labelOf = (list: { key: string; label: string }[], key: string) => list.find(x => x.key === key)?.label || key;

const LookCustomizer: React.FC<Props> = ({ draftTheme, updateThemeValue }) => {
    const { key, overrides } = parseTemplateValue((draftTheme as any).landingTemplate);
    const def = TEMPLATE_BY_KEY[key];
    const look = def.look;

    // Font di tutti i template per l'anteprima nel selettore degli abbinamenti (solo nella dashboard)
    useEffect(() => {
        const id = 'look-customizer-fonts';
        if (document.getElementById(id)) return;
        const href = buildTemplateFontsHref(MENU_TEMPLATES);
        if (!href) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, []);

    const set = <K extends keyof LookOverrides>(k: K, v: LookOverrides[K] | '' | undefined) => {
        const next: LookOverrides = { ...overrides };
        if (v === '' || v === undefined) delete next[k];
        else next[k] = v as LookOverrides[K];
        updateThemeValue('landingTemplate', serializeTemplateValue(key, next));
    };

    const legacyRadius = (draftTheme.cardStyle === 'rounded' || draftTheme.cardStyle === 'sharp') && typeof overrides.r !== 'number';
    const radiusValue = typeof overrides.r === 'number' ? String(overrides.r) : legacyRadius ? `legacy-${draftTheme.cardStyle}` : '';
    const singleFont = draftTheme.font && draftTheme.font !== TEMPLATE_FONT_KEY;
    const pairDef = overrides.fp ? TEMPLATE_BY_KEY[overrides.fp] : def;
    const touched = Object.keys(overrides).length > 0;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ritocchi del template</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Template in uso: <strong>{def.label}</strong>. Ogni voce parte dalla scelta del template: cambiala solo se vuoi.
                    </p>
                </div>
                {touched && (
                    <button
                        type="button"
                        onClick={() => updateThemeValue('landingTemplate', key)}
                        className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md px-2 py-1"
                        title="Torna a tutte le scelte del template"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Ripristina
                    </button>
                )}
            </div>

            {/* Tipografia */}
            <div>
                <label className="label-style text-sm">Abbinamento di font</label>
                <select
                    value={overrides.fp || ''}
                    onChange={e => {
                        set('fp', (e.target.value || '') as any);
                        if (singleFont) updateThemeValue('font', TEMPLATE_FONT_KEY);
                    }}
                    className="input-style mt-1"
                    style={{ fontFamily: pairDef.fonts.display }}
                >
                    <option value="">Come da template — {fontPairLabel(def)}</option>
                    {MENU_TEMPLATES.filter(t => t.key !== key).map(t => (
                        <option key={t.key} value={t.key} style={{ fontFamily: t.fonts.display }}>{fontPairLabel(t)}</option>
                    ))}
                </select>
                <div className="mt-2 rounded-md border border-gray-200 bg-stone-50 px-3 py-2.5">
                    <p style={{ fontFamily: pairDef.fonts.display, fontSize: 20, lineHeight: 1.1, color: '#1f1a14' }}>Tagliatelle al ragù</p>
                    <p style={{ fontFamily: pairDef.fonts.body, fontSize: 13, color: '#5b5143', marginTop: 3 }}>Pasta all'uovo tirata a mano, ragù di manzo e maiale</p>
                </div>
                {singleFont && (
                    <p className="text-[11px] text-amber-700 mt-1">
                        Nel tab Colori è scelto un font singolo, che ha la precedenza. Scegliendo un abbinamento qui viene tolto.
                    </p>
                )}
            </div>

            <hr />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Piatti</p>
            <Select label="Impaginazione dei piatti" value={overrides.pl || ''} templateLabel={labelOf(PRODUCT_LAYOUTS, look.productLayout)}
                options={PRODUCT_LAYOUTS} onChange={v => set('pl', v as any)} />
            <Select label="Spaziatura" value={overrides.de || ''} templateLabel={labelOf(DENSITIES, look.density)}
                options={DENSITIES} onChange={v => set('de', v as any)} hint="Compatta per menu lunghi, ariosa per pochi piatti." />
            <Select label="Posizione del prezzo" value={overrides.pp || ''} templateLabel={labelOf(PRICE_POSITIONS, look.pricePosition)}
                options={PRICE_POSITIONS} onChange={v => set('pp', v as any)} hint="Vale per l'elenco; nella griglia il prezzo è sempre sotto." />
            <Select label="Forma delle foto" value={overrides.im || ''} templateLabel={labelOf(IMAGE_SHAPES, look.imageShape)}
                options={IMAGE_SHAPES} onChange={v => set('im', v as any)} />

            <hr />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Pagina</p>
            <Select label="Testata con il nome" value={overrides.hd || ''} templateLabel={labelOf(HEADER_STYLES, look.headerStyle)}
                options={HEADER_STYLES} onChange={v => set('hd', v as any)} hint="Nelle pagine del menu e nel sito vetrina con testata tipografica." />
            <Select label="Titoli delle sezioni" value={overrides.sh || ''} templateLabel={labelOf(SECTION_HEADERS, look.sectionHeader)}
                options={SECTION_HEADERS} onChange={v => set('sh', v as any)} />
            <Select label="Barra delle categorie" value={overrides.cn || ''} templateLabel={labelOf(CATEGORY_NAVS, look.categoryNav)}
                options={CATEGORY_NAVS} onChange={v => set('cn', v as any)} />
            <Select label="Divisori" value={overrides.dv || ''} templateLabel={labelOf(DIVIDERS, look.divider)}
                options={DIVIDERS} onChange={v => set('dv', v as any)} />
            <Select label="Texture di fondo" value={overrides.tx || ''} templateLabel={labelOf(TEXTURES, look.texture)}
                options={TEXTURES} onChange={v => set('tx', v as any)} hint="Le texture per fondi scuri si vedono solo su colori di sfondo scuri." />

            <hr />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Forme</p>
            <div>
                <label className="label-style text-sm">Angoli di foto, riquadri e pulsanti</label>
                <select
                    value={radiusValue}
                    onChange={e => {
                        const v = e.target.value;
                        if (v.startsWith('legacy-')) return;
                        // il vecchio campo cardStyle torna "come da template": decide il ritocco
                        updateThemeValue('cardStyle', 'soft');
                        set('r', v === '' ? undefined : Number(v));
                    }}
                    className="input-style mt-1"
                >
                    <option value="">Come da template — {look.radius} px</option>
                    {legacyRadius && (
                        <option value={`legacy-${draftTheme.cardStyle}`}>
                            {draftTheme.cardStyle === 'rounded' ? 'Arrotondati (18 px)' : 'Squadrati (0 px)'} — impostazione precedente
                        </option>
                    )}
                    {RADIUS_STEPS.map(r => <option key={r} value={String(r)}>{RADIUS_LABEL[r]}</option>)}
                </select>
            </div>
            <Select label="Pulsanti del sito vetrina" value={overrides.bt || ''} templateLabel={labelOf(BUTTON_STYLES, look.buttonStyle)}
                options={BUTTON_STYLES} onChange={v => set('bt', v as any)} />
        </div>
    );
};

export default LookCustomizer;
