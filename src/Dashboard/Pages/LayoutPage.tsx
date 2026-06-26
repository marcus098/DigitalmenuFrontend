import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Save, Paintbrush, FileText, Settings, Eye, Pencil, Image, X, Loader, Trash2, Layout, Smartphone, Monitor, RefreshCw, ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { FeatureCard, StyleDto, UpdateStyle } from "../../types";
import { useNotification } from "../../Context/NotificationContext";
import CustomLoading from "../../Components/CustomLoading";
import { FEATURE_ICONS } from "../../Utilities/featureIcons";
import { AVAILABLE_FONTS } from "../../Utilities/fonts";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FEATURES: FeatureCard[] = [
    { icon: 'beef',       title: 'Ingredienti Freschi', sub: 'Selezionati ogni giorno' },
    { icon: 'chef-hat',   title: 'Ricette Originali',   sub: 'Chef di esperienza' },
    { icon: 'zap',        title: 'Veloce & Buono',      sub: 'Pronto in pochissimo' },
    { icon: 'smartphone', title: 'Ordina dal Tavolo',   sub: 'Scansiona il QR' },
];

const TEMPLATES = [
    {
        key: 'default',
        label: 'Classico',
        desc: 'Hero grande, ticker colorato, dark info section. Il layout originale, ricco di impatto.',
        preview: (primary: string) => (
            <div className="w-full h-28 rounded-lg overflow-hidden flex flex-col gap-0.5">
                <div className="h-16 flex items-end p-2" style={{ background: `linear-gradient(135deg, #111 60%, ${primary}33)` }}>
                    <div className="w-12 h-2 rounded bg-white/60" />
                </div>
                <div className="h-3" style={{ backgroundColor: primary }} />
                <div className="flex gap-1 px-2 pt-1.5 flex-1 bg-gray-50">
                    <div className="flex-1 h-8 rounded bg-gray-200" />
                    <div className="flex-1 h-8 rounded bg-gray-200" />
                    <div className="flex-1 h-8 rounded bg-gray-200" />
                </div>
            </div>
        ),
    },
    {
        key: 'minimal',
        label: 'Minimal',
        desc: 'Layout pulito, tutto bianco. Navbar sempre visibile, hero compatto, focus sul menu.',
        preview: (primary: string) => (
            <div className="w-full h-28 rounded-lg overflow-hidden flex flex-col gap-0.5">
                <div className="h-8 bg-white border-b border-gray-200 flex items-center px-3 gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary }} />
                    <div className="w-16 h-2 rounded bg-gray-200" />
                </div>
                <div className="h-14 bg-gray-50 flex items-center justify-center">
                    <div className="w-24 h-4 rounded bg-gray-300" />
                </div>
                <div className="flex gap-1 px-2 pt-1 flex-1 bg-white">
                    <div className="flex-1 h-6 rounded bg-gray-100" />
                    <div className="flex-1 h-6 rounded bg-gray-100" />
                </div>
            </div>
        ),
    },
    {
        key: 'luxury',
        label: 'Luxury',
        desc: 'Dark premium, cinematografico. Hero full-screen, tutto nero, accenti nel colore primario.',
        preview: (primary: string) => (
            <div className="w-full h-28 rounded-lg overflow-hidden flex flex-col">
                <div className="h-20 bg-[#080808] flex items-end p-3">
                    <div>
                        <div className="w-4 h-0.5 rounded mb-1" style={{ backgroundColor: primary }} />
                        <div className="w-20 h-3 rounded bg-white/70" />
                    </div>
                </div>
                <div className="flex gap-0.5 flex-1 bg-[#111]">
                    <div className="flex-1 bg-[#1a1a1a] rounded-sm m-1" />
                    <div className="flex-1 bg-[#1a1a1a] rounded-sm m-1" />
                    <div className="flex-1 bg-[#1a1a1a] rounded-sm m-1" />
                </div>
            </div>
        ),
    },
] as const;

// ─── Reusable sub-components ──────────────────────────────────────────────────

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; onRemove?: () => void }> = ({ label, value, onChange, onRemove }) => (
    <div>
        <label className="label-style text-sm">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md cursor-pointer" />
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className="input-style flex-grow" />
            {onRemove && <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><X className="w-5 h-5" /></button>}
        </div>
    </div>
);

const ToggleInput: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }> = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
        <div>
            <label className="font-semibold text-gray-700 text-sm">{label}</label>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <div onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0 ml-3 ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    </div>
);

const ImageUploader: React.FC<{ label: string; imageUrl: string | null; onImageChange: (f: File) => void; onImageRemove?: () => void }> = ({ label, imageUrl, onImageChange, onImageRemove }) => {
    const uid = `file-upload-${label.replace(/\s+/g, '-')}`;
    return (
        <div>
            <label className="label-style">{label}</label>
            <div className="relative mt-1 w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group">
                <div onClick={() => document.getElementById(uid)?.click()} className="w-full h-full cursor-pointer flex items-center justify-center">
                    <input type="file" id={uid} accept="image/*" onChange={e => e.target.files?.[0] && onImageChange(e.target.files[0])} className="hidden" />
                    {imageUrl ? (
                        <img src={imageUrl} alt="Anteprima" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <Image className="w-10 h-10 mx-auto text-gray-400" />
                            <p className="mt-1 text-xs font-semibold">Carica Immagine</p>
                        </div>
                    )}
                </div>
                {imageUrl && onImageRemove && (
                    <button onClick={e => { e.stopPropagation(); onImageRemove(); }} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-600 transition-all z-10">
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

const MockHeader: React.FC<{ theme: StyleDto }> = ({ theme }) => (
    <div style={{ backgroundColor: theme.primary, backgroundSize: 'cover', backgroundPosition: 'center' }} className="p-8 text-center shadow-lg">
        {theme.logoUrl ? (
            <img src={(process.env.REACT_APP_BUCKET_URL || '') + theme.logoUrl} alt="Logo" className="w-20 h-20 rounded-full mx-auto border-4 border-white/80 shadow-md object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
            <div className="w-20 h-20 rounded-full mx-auto border-4 border-white/80 shadow-md bg-white/20 flex items-center justify-center text-2xl font-black text-white">
                {theme.restaurantName?.charAt(0).toUpperCase() || 'R'}
            </div>
        )}
        <h1 style={{ color: theme.textOnPrimary }} className="text-3xl font-bold mt-3">{theme.restaurantName}</h1>
        {(theme as any).description && <p className="text-white/70 text-sm mt-1">{(theme as any).description}</p>}
    </div>
);

const MockCategoryCard: React.FC<{ theme: StyleDto; name: string }> = ({ theme, name }) => {
    const cardStyles = { soft: 'rounded-xl', rounded: 'rounded-full', sharp: 'rounded-none' };
    return (
        <div style={{ backgroundColor: theme.cardBackground }} className={`w-full aspect-square ${cardStyles[theme.cardStyle]} shadow-md flex flex-col items-center justify-center`}>
            {theme.showImages && <div className="w-12 h-12 bg-gray-200 rounded-md mb-2" />}
            <p style={{ color: theme.textTitle }} className="font-semibold text-sm text-center px-2">{name}</p>
        </div>
    );
};

// ─── ControlPanel ─────────────────────────────────────────────────────────────

type ActiveTab = 'colors' | 'content' | 'layout' | 'template';

// @ts-ignore
const ControlPanel: React.FC<{
    activeTab: ActiveTab;
    setActiveTab: (t: ActiveTab) => void;
    draftTheme: StyleDto;
    updateThemeValue: (k: keyof StyleDto | string, v: any) => void;
    handleBgColorChange: (i: number, v: string) => void;
    removeBgColor: (i: number) => void;
    addBgColor: () => void;
    handleLogoSelect: (f: File) => void;
    handleHeroSelect: (f: File) => void;
    removeLogo: () => void;
    removeHero: () => void;
    updateFeature: (i: number, k: keyof FeatureCard, v: string) => void;
}> = ({
    activeTab, setActiveTab, draftTheme, updateThemeValue,
    handleBgColorChange, removeBgColor, addBgColor,
    handleLogoSelect, handleHeroSelect, removeLogo, removeHero,
    updateFeature,
}) => {
    const features: FeatureCard[] = draftTheme.features?.length ? draftTheme.features : DEFAULT_FEATURES;
    const template = (draftTheme as any).landingTemplate || 'default';

    const logoPreview = draftTheme.logoUrl
        ? (draftTheme.logoUrl.startsWith('blob:') ? draftTheme.logoUrl : (process.env.REACT_APP_BUCKET_URL || '') + draftTheme.logoUrl)
        : null;
    const heroPreview = draftTheme.heroImageUrl
        ? (draftTheme.heroImageUrl.startsWith('blob:') ? draftTheme.heroImageUrl : (process.env.REACT_APP_BUCKET_URL || '') + draftTheme.heroImageUrl)
        : null;

    const tabs: { key: ActiveTab; label: string; icon: React.FC<any> }[] = [
        { key: 'colors',   label: 'Colori',    icon: Paintbrush },
        { key: 'content',  label: 'Contenuti', icon: FileText },
        { key: 'layout',   label: 'Layout',    icon: Settings },
        { key: 'template', label: 'Template',  icon: Layout },
    ];

    return (
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg overflow-y-auto h-full">

            {/* Tabs */}
            <div className="flex border-b mb-5 gap-0 overflow-x-auto">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1 px-3 py-2.5 font-semibold text-xs whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                            activeTab === key ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Colors ── */}
            {activeTab === 'colors' && (
                <div className="space-y-4">
                    <div>
                        <label className="label-style">Colori Sfondo (Gradiente)</label>
                        <div className="space-y-2 mt-1 p-3 bg-slate-50 rounded-lg border">
                            {draftTheme.backgroundGradient.map((color, i) => (
                                <ColorInput key={i} label={`Colore ${i + 1}`} value={color}
                                    onChange={v => handleBgColorChange(i, v)}
                                    onRemove={() => removeBgColor(i)} />
                            ))}
                            {draftTheme.backgroundGradient.length < 3 && (
                                <button onClick={addBgColor} className="btn-secondary text-sm w-full justify-center items-center">Aggiungi Colore</button>
                            )}
                        </div>
                    </div>
                    <hr />
                    <ColorInput label="Colore Primario (CTA principali)" value={draftTheme.primary} onChange={v => updateThemeValue('primary', v)} />
                    <ColorInput label="Testo su Primario" value={draftTheme.textOnPrimary} onChange={v => updateThemeValue('textOnPrimary', v)} />
                    <ColorInput label="Colore Secondario (bottoni Prenota / Asporto)" value={(draftTheme as any).secondaryColor || '#0e0e0e'} onChange={v => updateThemeValue('secondaryColor', v)} />
                    <ColorInput label="Testo su Secondario" value={(draftTheme as any).secondaryTextColor || '#ffffff'} onChange={v => updateThemeValue('secondaryTextColor', v)} />
                    <ColorInput label="Sfondo Card" value={draftTheme.cardBackground} onChange={v => updateThemeValue('cardBackground', v)} />
                    <ColorInput label="Testo Titoli" value={draftTheme.textTitle} onChange={v => updateThemeValue('textTitle', v)} />
                    <ColorInput label="Testo Corpo" value={draftTheme.textBody} onChange={v => updateThemeValue('textBody', v)} />
                    <hr />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tipografia</p>
                    <div>
                        <label className="label-style text-sm">Font</label>
                        <select
                            value={draftTheme.font || 'system'}
                            onChange={e => updateThemeValue('font', e.target.value)}
                            className="input-style mt-1"
                            style={{ fontFamily: AVAILABLE_FONTS.find(f => f.key === (draftTheme.font || 'system'))?.family }}
                        >
                            {AVAILABLE_FONTS.map(f => (
                                <option key={f.key} value={f.key} style={{ fontFamily: f.family }}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Il font viene applicato a tutta la landing e alle pagine menu/carrello.
                        </p>
                    </div>
                    <hr />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Hero (intestazione)</p>
                    <ColorInput
                        label="Colore Hero"
                        value={(draftTheme as any).heroBgColor || '#0e0e0e'}
                        onChange={v => updateThemeValue('heroBgColor', v)}
                    />
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="label-style text-sm">
                                Opacità colore sopra immagine
                            </label>
                            <span className="text-xs font-mono text-gray-500">
                                {Math.round(((draftTheme as any).heroOverlayOpacity ?? 0.6) * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round(((draftTheme as any).heroOverlayOpacity ?? 0.6) * 100)}
                            onChange={e => updateThemeValue('heroOverlayOpacity', parseInt(e.target.value, 10) / 100)}
                            className="w-full accent-primary"
                            style={{ accentColor: draftTheme.primary }}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            0% = foto pulita · 100% = colore pieno (foto nascosta). Se non c'è immagine, l'hero usa il colore pieno.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {activeTab === 'content' && (
                <div className="space-y-4">
                    <ImageUploader label="Logo Ristorante" imageUrl={logoPreview} onImageChange={handleLogoSelect} onImageRemove={removeLogo} />
                    <ImageUploader label="Immagine Hero (Sito Vetrina)" imageUrl={heroPreview} onImageChange={handleHeroSelect} onImageRemove={removeHero} />
                    <hr />
                    <div>
                        <label className="label-style">Nome Ristorante</label>
                        <input type="text" value={draftTheme.restaurantName} onChange={e => updateThemeValue('restaurantName', e.target.value)} className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">Tagline / Descrizione Breve</label>
                        <input type="text" value={(draftTheme as any).description || ''} onChange={e => updateThemeValue('description', e.target.value)} className="input-style mt-1" placeholder="es. Il gusto che ti stravolge" />
                    </div>
                    <div>
                        <label className="label-style">Indirizzo</label>
                        <input type="text" value={draftTheme.address} onChange={e => updateThemeValue('address', e.target.value)} className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">Orari di Apertura</label>
                        <input type="text" value={(draftTheme as any).openingHours || ''} onChange={e => updateThemeValue('openingHours', e.target.value)} className="input-style mt-1" placeholder="es. Tutti i giorni 18:00 – 23:00" />
                    </div>
                    <div>
                        <label className="label-style">Telefono</label>
                        <input type="text" value={draftTheme.phone} onChange={e => updateThemeValue('phone', e.target.value)} className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">WhatsApp (numero con prefisso)</label>
                        <input type="text" value={(draftTheme as any).whatsapp || ''} onChange={e => updateThemeValue('whatsapp', e.target.value)} className="input-style mt-1" placeholder="es. +39 333 123 4567" />
                    </div>
                    <hr />
                    <div>
                        <label className="label-style">Link Instagram</label>
                        <input type="text" value={draftTheme.instagramUrl} onChange={e => updateThemeValue('instagramUrl', e.target.value)} className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">Link Facebook</label>
                        <input type="text" value={draftTheme.facebookUrl} onChange={e => updateThemeValue('facebookUrl', e.target.value)} className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">Link TikTok</label>
                        <input type="text" value={(draftTheme as any).tiktokUrl || ''} onChange={e => updateThemeValue('tiktokUrl', e.target.value)} className="input-style mt-1" />
                    </div>
                    <hr />
                    {/* Feature cards editor */}
                    <div>
                        <label className="label-style">Sezione "Perché Noi" — 4 card</label>
                        <p className="text-xs text-gray-400 mt-0.5 mb-3">Personalizza le 4 card che appaiono nella sezione highlights della landing page.</p>
                        <div className="space-y-3">
                            {features.map((f, i) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Card {i + 1}</p>
                                    <div>
                                        <label className="label-style text-xs">Icona</label>
                                        <div className="grid grid-cols-8 gap-1 mt-1 p-2 bg-white border border-gray-200 rounded-lg max-h-44 overflow-y-auto">
                                            {FEATURE_ICONS.map(({ key, label, Cmp }) => {
                                                const selected = f.icon === key;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={key}
                                                        onClick={() => updateFeature(i, 'icon', key)}
                                                        title={label}
                                                        className={`aspect-square flex items-center justify-center rounded-md transition-colors ${
                                                            selected ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                        style={selected ? { backgroundColor: draftTheme.primary } : undefined}
                                                    >
                                                        <Cmp className="w-5 h-5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {!FEATURE_ICONS.some(ic => ic.key === f.icon) && f.icon && (
                                            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                                <span>⚠</span>
                                                Icona attuale "{f.icon}" non è in catalogo (verrà mostrata come testo). Scegli una delle icone qui sopra.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="label-style text-xs">Titolo</label>
                                        <input type="text" value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)} className="input-style mt-0.5" />
                                    </div>
                                    <div>
                                        <label className="label-style text-xs">Sottotitolo</label>
                                        <input type="text" value={f.sub} onChange={e => updateFeature(i, 'sub', e.target.value)} className="input-style mt-0.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Layout ── */}
            {activeTab === 'layout' && (
                <div className="space-y-4">
                    <ToggleInput label="Mostra Immagini nelle Card" checked={draftTheme.showImages} onChange={v => updateThemeValue('showImages', v)} />
                    <div>
                        <label className="label-style">Stile Angoli Card</label>
                        <select value={draftTheme.cardStyle} onChange={e => updateThemeValue('cardStyle', e.target.value)} className="input-style mt-1">
                            <option value="soft">Morbido (consigliato)</option>
                            <option value="rounded">Molto arrotondato</option>
                            <option value="sharp">Squadrato</option>
                        </select>
                    </div>
                    <hr />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sezioni visibili</p>
                    <ToggleInput label='Sezione "Perché noi"' checked={(draftTheme as any).showWhyUs ?? true} onChange={v => updateThemeValue('showWhyUs', v)} description="I 4 box highlights sotto la hero" />
                    <ToggleInput label="Ticker colorato" checked={(draftTheme as any).showTicker ?? true} onChange={v => updateThemeValue('showTicker', v)} description="La barra animata con le categorie" />
                    <ToggleInput label="Sezione Prenotazioni" checked={(draftTheme as any).showBooking ?? true} onChange={v => updateThemeValue('showBooking', v)} description="Form per prenotare il tavolo" />
                    <hr />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Titoli sezioni</p>
                    <div>
                        <label className="label-style">Titolo sezione Menu</label>
                        <input type="text" value={(draftTheme as any).sectionMenuTitle || ''} onChange={e => updateThemeValue('sectionMenuTitle', e.target.value)} className="input-style mt-1" placeholder="Il Nostro Menu" />
                    </div>
                    <div>
                        <label className="label-style">Titolo sezione "Perché noi"</label>
                        <input type="text" value={(draftTheme as any).sectionWhyTitle || ''} onChange={e => updateThemeValue('sectionWhyTitle', e.target.value)} className="input-style mt-1" placeholder="Lascia vuoto per nascondere il titolo" />
                    </div>
                    <div>
                        <label className="label-style">Titolo sezione Prenotazioni</label>
                        <input type="text" value={(draftTheme as any).sectionBookingTitle || ''} onChange={e => updateThemeValue('sectionBookingTitle', e.target.value)} className="input-style mt-1" placeholder="Prenota il tuo Tavolo" />
                    </div>
                </div>
            )}

            {/* ── Template ── */}
            {activeTab === 'template' && (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Scegli il layout della landing page</p>
                        <p className="text-xs text-gray-400 mb-4">Il template cambia l'aspetto visivo complessivo. Tutti i tuoi contenuti (testi, immagini, colori) restano invariati.</p>
                    </div>
                    <div className="space-y-3">
                        {TEMPLATES.map(t => {
                            const isSelected = template === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => updateThemeValue('landingTemplate', t.key)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="mb-3">{t.preview(draftTheme.primary)}</div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className={`font-black text-base ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{t.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.desc}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                                            isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── PreviewPanel ─────────────────────────────────────────────────────────────
// Anteprima live: iframe punta al sito vetrina pubblico `/${localname}?preview=1`.
// Ogni cambio nel pannello manda il `draftTheme` via postMessage, e VenueLandingPage
// lo applica sopra lo stile salvato — così vedi le modifiche in tempo reale senza
// dover salvare. Le foto nuove (logo/hero) vengono mostrate via blob URL locali.

const PreviewPanel: React.FC<{ draftTheme: StyleDto; localname: string }> = ({ draftTheme, localname }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [ready, setReady] = useState(false);
    const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
    const [reloadKey, setReloadKey] = useState(0);

    const src = `/${localname}?preview=1`;
    const publicUrl = `/${localname}`;

    // Quando l'iframe segnala "pronto", marchiamo come ready per iniziare a inviare.
    // Salviamo anche l'ultimo draftTheme in un ref così possiamo rispondere subito al ready.
    const draftRef = useRef(draftTheme);
    useEffect(() => { draftRef.current = draftTheme; }, [draftTheme]);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.origin !== window.location.origin) return;
            if (e.data?.type === 'rf-layout-preview-ready') {
                setReady(true);
                // rispondi immediatamente con lo stato corrente
                iframeRef.current?.contentWindow?.postMessage(
                    { type: 'rf-layout-preview', payload: draftRef.current },
                    window.location.origin,
                );
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // Reset ready quando ricarichi
    useEffect(() => { setReady(false); }, [reloadKey]);

    // Push del draftTheme via postMessage a ogni cambio (debounced 50ms per non spammare).
    // Anche se non ancora ready inviamo: se l'iframe non è pronto verrà perso, ma al ready
    // riceverà comunque lo stato corrente via il responder qui sopra.
    useEffect(() => {
        if (!iframeRef.current?.contentWindow) return;
        const t = setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage(
                { type: 'rf-layout-preview', payload: draftTheme },
                window.location.origin,
            );
        }, 50);
        return () => clearTimeout(t);
    }, [draftTheme, ready]);

    const frameClass = device === 'mobile'
        ? 'w-[375px] h-[800px] rounded-[2rem] ring-8 ring-gray-900 shadow-2xl'
        : 'w-full max-w-[1200px] h-[760px] rounded-lg shadow-2xl ring-1 ring-gray-300';

    return (
        <div className="lg:col-span-2 bg-slate-100 rounded-xl p-3 md:p-5 flex flex-col h-full min-h-[600px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    <button
                        onClick={() => setDevice('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            device === 'mobile' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Mobile"
                    >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                    <button
                        onClick={() => setDevice('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            device === 'desktop' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Desktop"
                    >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setReloadKey(k => k + 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-white hover:text-gray-800 transition-colors"
                        title="Ricarica anteprima"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Ricarica
                    </button>
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:bg-white hover:text-gray-800 transition-colors"
                        title="Apri il sito pubblico in una nuova scheda"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Apri
                    </a>
                </div>
            </div>

            {/* Frame */}
            <div className="flex-1 flex justify-center items-start overflow-auto p-2">
                <div className={`${frameClass} bg-white overflow-hidden flex-shrink-0 transition-all`}>
                    <iframe
                        key={reloadKey}
                        ref={iframeRef}
                        src={src}
                        title="Anteprima sito vetrina"
                        className="w-full h-full border-0 bg-white"
                        loading="lazy"
                    />
                </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-2">
                Anteprima live — la navigazione è bloccata. Salva per pubblicare le modifiche.
            </p>
        </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const LayoutPage: React.FC = () => {
    const { updateStyle, styles, loading } = useData();
    const { localname } = useParams<{ localname: string }>();
    const [draftTheme, setDraftTheme] = useState<StyleDto>(styles || {
        backgroundGradient: [], cardBackground: "#FFFFFF", primary: "#fb923c", textBody: "#6b7280",
        textOnPrimary: "#FFFFFF", textTitle: "#1f2937", address: "", phone: "",
        facebookUrl: "", instagramUrl: "", heroImageUrl: "", logoUrl: "",
        restaurantName: "Il Tuo Ristorante", cardStyle: "soft", showImages: true, font: "sans-serif",
        description: "", openingHours: "", whatsapp: "", tiktokUrl: "",
        features: DEFAULT_FEATURES,
        sectionMenuTitle: "", sectionBookingTitle: "", sectionWhyTitle: "",
        showWhyUs: true, showBooking: true, showTicker: true, landingTemplate: 'default',
    });

    const [activeTab,        setActiveTab]        = useState<ActiveTab>('colors');
    const [activeMobileView, setActiveMobileView] = useState<'edit' | 'preview'>('edit');
    const [logoFile,         setLogoFile]         = useState<File | null>(null);
    const [heroFile,         setHeroFile]         = useState<File | null>(null);
    const [isDirty,          setIsDirty]          = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (styles && !isDirty) setDraftTheme(styles);
    }, [styles, isDirty]);

    const backgroundCss = useMemo(() => {
        if (!draftTheme.backgroundGradient?.length) return { backgroundColor: '#F1F5F9' };
        if (draftTheme.backgroundGradient.length === 1) return { backgroundColor: draftTheme.backgroundGradient[0] };
        return { backgroundImage: `linear-gradient(to bottom right, ${draftTheme.backgroundGradient.join(', ')})` };
    }, [draftTheme.backgroundGradient]);

    const updateThemeValue = useCallback((key: string, value: any) => {
        setDraftTheme(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    const updateFeature = useCallback((idx: number, key: keyof FeatureCard, val: string) => {
        const features = draftTheme.features?.length ? [...draftTheme.features] : [...DEFAULT_FEATURES];
        features[idx] = { ...features[idx], [key]: val };
        updateThemeValue('features', features);
    }, [draftTheme.features, updateThemeValue]);

    const handleBgColorChange = useCallback((i: number, v: string) => {
        const newColors = [...draftTheme.backgroundGradient];
        newColors[i] = v;
        updateThemeValue('backgroundGradient', newColors);
    }, [draftTheme.backgroundGradient, updateThemeValue]);

    const addBgColor = useCallback(() => {
        if (draftTheme.backgroundGradient.length < 3)
            updateThemeValue('backgroundGradient', [...draftTheme.backgroundGradient, '#ffffff']);
    }, [draftTheme.backgroundGradient, updateThemeValue]);

    const removeBgColor = useCallback((i: number) =>
        updateThemeValue('backgroundGradient', draftTheme.backgroundGradient.filter((_, idx) => idx !== i)),
    [draftTheme.backgroundGradient, updateThemeValue]);

    const handleLogoSelect = useCallback((file: File) => {
        setLogoFile(file);
        updateThemeValue('logoUrl', URL.createObjectURL(file));
    }, [updateThemeValue]);

    const handleHeroSelect = useCallback((file: File) => {
        setHeroFile(file);
        updateThemeValue('heroImageUrl', URL.createObjectURL(file));
    }, [updateThemeValue]);

    const handleSaveTheme = async () => {
        const d = draftTheme as any;
        const features: FeatureCard[] = d.features?.length ? d.features : DEFAULT_FEATURES;
        const payload: UpdateStyle = {
            ...draftTheme,
            backgroundGradient: draftTheme.backgroundGradient.join(";"),
            cardStyle: draftTheme.cardStyle as "soft" | "rounded" | "sharp",
            description: d.description || "",
            openingHours: d.openingHours || "",
            whatsapp: d.whatsapp || "",
            tiktokUrl: d.tiktokUrl || "",
            features: JSON.stringify(features),
            sectionMenuTitle: d.sectionMenuTitle || "",
            sectionBookingTitle: d.sectionBookingTitle || "",
            sectionWhyTitle: d.sectionWhyTitle || "",
            showWhyUs: d.showWhyUs ?? true,
            showBooking: d.showBooking ?? true,
            showTicker: d.showTicker ?? true,
            landingTemplate: d.landingTemplate || "default",
            heroBgColor: d.heroBgColor || "#0e0e0e",
            heroOverlayOpacity: typeof d.heroOverlayOpacity === 'number' ? d.heroOverlayOpacity : 0.6,
            secondaryColor: d.secondaryColor || "#0e0e0e",
            secondaryTextColor: d.secondaryTextColor || "#ffffff",
            font: d.font || "system",
        } as any;
        const ok = await updateStyle(payload, logoFile, heroFile);
        if (ok) {
            addNotification({ message: "Stile modificato", type: "success" });
            setLogoFile(null);
            setHeroFile(null);
            setIsDirty(false);
        } else {
            addNotification({ message: "Errore durante il salvataggio dello stile", type: "error" });
        }
    };

    const removeHero = () => { setHeroFile(null); updateThemeValue('heroImageUrl', "DELETE"); };
    const removeLogo = () => { setLogoFile(null); updateThemeValue('logoUrl', "DELETE"); };

    const panelProps = {
        activeTab, setActiveTab, draftTheme, updateThemeValue,
        handleBgColorChange, removeBgColor, addBgColor,
        handleLogoSelect, handleHeroSelect, removeLogo, removeHero,
        updateFeature,
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col">
            {loading && <CustomLoading isFullPage />}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Personalizza Aspetto</h1>
                    <p className="text-gray-500 mt-1">Modifica l'aspetto del menu e della landing page.</p>
                </div>
                <button
                    onClick={handleSaveTheme}
                    disabled={!isDirty || loading}
                    className="btn-primary flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" /><span>Salva Modifiche</span>
                </button>
            </div>

            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                <ControlPanel {...panelProps} />
                <PreviewPanel draftTheme={draftTheme} localname={localname || ''} />
            </div>

            <div className="lg:hidden flex flex-col flex-grow mb-16">
                {activeMobileView === 'edit'
                    ? <ControlPanel {...panelProps} />
                    : <PreviewPanel draftTheme={draftTheme} localname={localname || ''} />
                }
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.1)] border-t z-40 flex justify-around">
                <button onClick={() => setActiveMobileView('edit')} className={`flex-1 flex flex-col items-center p-3 text-sm font-semibold ${activeMobileView === 'edit' ? 'text-primary' : 'text-gray-500'}`}>
                    <Pencil className="w-6 h-6" /><span>Modifica</span>
                </button>
                <button onClick={() => setActiveMobileView('preview')} className={`flex-1 flex flex-col items-center p-3 text-sm font-semibold ${activeMobileView === 'preview' ? 'text-primary' : 'text-gray-500'}`}>
                    <Eye className="w-6 h-6" /><span>Anteprima</span>
                </button>
            </div>
        </div>
    );
};

export default LayoutPage;
