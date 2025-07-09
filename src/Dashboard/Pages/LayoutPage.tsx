import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaSave } from 'react-icons/fa';
import { useData } from '../../Context/DataContext';

import { PaintBrushIcon, DocumentTextIcon, CogIcon, EyeIcon, PencilIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {StyleDto, UpdateStyle} from "../../types";
import {useNotification} from "../../Context/NotificationContext";
import {Loader} from "lucide-react";
import {TrashIcon} from "@heroicons/react/24/solid";
import CustomLoading from "../../Components/CustomLoading";

// --- Componenti Riutilizzabili (Nessuna modifica qui) ---
const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; onRemove?: () => void }> = ({ label, value, onChange, onRemove }) => (
    <div>
        <label className="label-style text-sm">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md cursor-pointer"/>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className="input-style flex-grow"/>
            {onRemove && <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><XMarkIcon className="w-5 h-5"/></button>}
        </div>
    </div>
);

const ToggleInput: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
        <label className="font-semibold text-gray-700">{label}</label>
        <div onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></span>
        </div>
    </div>
);

const ImageUploader: React.FC<{
    label: string;
    imageUrl: string | null; // Meglio usare null per indicare l'assenza
    onImageChange: (file: File) => void;
    onImageRemove?: () => void; // <-- NUOVA PROP
}> = ({ label, imageUrl, onImageChange, onImageRemove }) => {
    const uniqueId = `file-upload-${label.replace(/\s+/g, '-')}`;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageChange(e.target.files[0]);
        }
    };

    const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Impedisce che il click sul cestino apra anche la finestra di dialogo per caricare i file
        e.stopPropagation();
        if (onImageRemove) {
            onImageRemove();
        }
    };

    return (
        <div>
            <label className="label-style">{label}</label>
            {/* Aggiungiamo la classe "relative" per posizionare il cestino */}
            <div className="relative mt-1 w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group">
                {/* Il div principale ora apre il selettore di file, ma non se si clicca sul cestino */}
                <div onClick={() => document.getElementById(uniqueId)?.click()} className="w-full h-full cursor-pointer hover:border-primary transition-colors flex items-center justify-center">
                    <input type="file" id={uniqueId} accept="image/*" onChange={handleFileSelect} className="hidden" />
                    {imageUrl ? (
                        <img src={imageUrl} alt="Anteprima" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <PhotoIcon className="w-10 h-10 mx-auto text-gray-400"/>
                            <p className="mt-1 text-xs font-semibold">Carica Immagine</p>
                        </div>
                    )}
                </div>

                {/* --- NUOVO: Pulsante Cestino --- */}
                {/* Mostra il cestino solo se c'è un'immagine e una funzione per rimuoverla */}
                {imageUrl && onImageRemove && (
                    <button
                        onClick={handleRemoveClick}
                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-red-600 transition-all duration-200 z-10"
                        aria-label="Rimuovi immagine"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};


const MockHeader: React.FC<{ theme: StyleDto }> = ({ theme }) => (
    <div style={{ backgroundColor: theme.primary, backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${process.env.REACT_APP_IMAGE_URL_START && theme.logoUrl.startsWith(process.env.REACT_APP_IMAGE_URL_START) ? process.env.REACT_APP_BUCKET_URL + theme.heroImageUrl : theme.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
         className="p-8 text-center shadow-lg">
        <img src={(process.env.REACT_APP_IMAGE_URL_START && theme.logoUrl.startsWith(process.env.REACT_APP_IMAGE_URL_START) ? process.env.REACT_APP_BUCKET_URL + "" : "") + theme.logoUrl} alt="Logo" className="w-20 h-20 rounded-full mx-auto border-4 border-white/80 shadow-md"/>
        <h1 style={{ color: theme.textOnPrimary }} className="text-3xl font-bold mt-3">{theme.restaurantName}</h1>
    </div>
);

const MockCategoryCard: React.FC<{ theme: StyleDto, name: string }> = ({ theme, name }) => {
    const cardStyles = {
        soft: 'rounded-xl',
        rounded: 'rounded-full',
        sharp: 'rounded-none'
    };
    return (
        <div style={{ backgroundColor: theme.cardBackground }} className={`w-full aspect-square ${cardStyles[theme.cardStyle]} shadow-md flex flex-col items-center justify-center`}>
            {theme.showImages && <div className="w-12 h-12 bg-gray-200 rounded-md mb-2"></div>}
            <p style={{ color: theme.textTitle }} className="font-semibold">{name}</p>
        </div>
    );
};


// --- INIZIO MODIFICA CHIAVE ---
// I componenti ControlPanel e PreviewPanel sono ora definiti FUORI da LayoutPage.
// Devono ricevere tutti i dati e le funzioni di cui hanno bisogno tramite le props.

// @ts-ignore
const ControlPanel: React.FC<{
    activeTab: 'colors' | 'content' | 'layout';
    setActiveTab: (tab: 'colors' | 'content' | 'layout') => void;
    draftTheme: StyleDto;
    updateThemeValue: (key: keyof StyleDto, value: any) => void;
    handleBgColorChange: (index: number, value: string) => void;
    removeBgColor: (index: number) => void;
    addBgColor: () => void;
    handleLogoSelect: (file: File) => void;
    handleHeroSelect: (file: File) => void;
    removeLogo: () => void;
    removeHero: () => void
}> = ({
          activeTab,
          setActiveTab,
          draftTheme,
          updateThemeValue,
          handleBgColorChange,
          removeBgColor,
          addBgColor,
          handleLogoSelect,
          handleHeroSelect,
          removeHero,
          removeLogo
      }) => (
    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg overflow-y-auto h-full">
        <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab('colors')} className={`p-3 font-semibold text-sm md:text-base ${activeTab === 'colors' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}><PaintBrushIcon className="w-5 h-5 inline mr-1"/>Colori</button>
            <button onClick={() => setActiveTab('content')} className={`p-3 font-semibold text-sm md:text-base ${activeTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}><DocumentTextIcon className="w-5 h-5 inline mr-1"/>Contenuti</button>
            <button onClick={() => setActiveTab('layout')} className={`p-3 font-semibold text-sm md:text-base ${activeTab === 'layout' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}><CogIcon className="w-5 h-5 inline mr-1"/>Layout</button>
        </div>

        {activeTab === 'colors' && (
            <div className="space-y-4">
                <div>
                    <label className="label-style">Colori Sfondo (Gradiente)</label>
                    <div className="space-y-2 mt-1 p-3 bg-slate-50 rounded-lg border">
                        {draftTheme.backgroundGradient.map((color, index) => (
                            <ColorInput key={index} label={`Colore ${index + 1}`} value={color}
                                        onChange={v => handleBgColorChange(index, v)}
                                        onRemove={() => removeBgColor(index)}/>
                        ))}
                        {draftTheme.backgroundGradient.length < 3 && <button onClick={addBgColor}
                                                                             className="btn-secondary text-sm w-full justify-center items-center">Aggiungi Colore</button>}
                    </div>
                </div>
                <hr/>
                <ColorInput label="Colore Primario" value={draftTheme.primary} onChange={v => updateThemeValue('primary', v)}/>
                <ColorInput label="Testo su Primario" value={draftTheme.textOnPrimary} onChange={v => updateThemeValue('textOnPrimary', v)}/>
                <ColorInput label="Sfondo Card" value={draftTheme.cardBackground} onChange={v => updateThemeValue('cardBackground', v)}/>
                <ColorInput label="Testo Titoli" value={draftTheme.textTitle} onChange={v => updateThemeValue('textTitle', v)}/>
                <ColorInput label="Testo Corpo" value={draftTheme.textBody} onChange={v => updateThemeValue('textBody', v)}/>
            </div>
        )}
        {activeTab === 'content' && (
            <div className="space-y-4">
                <ImageUploader label="Logo Ristorante" imageUrl={((process.env.REACT_APP_IMAGE_URL_START && draftTheme.logoUrl.startsWith(process.env.REACT_APP_IMAGE_URL_START) ? process.env.REACT_APP_BUCKET_URL + "" : "") + draftTheme.logoUrl) || ''} onImageChange={handleLogoSelect} onImageRemove={removeLogo}/>
                <ImageUploader label="Immagine Header" imageUrl={((process.env.REACT_APP_IMAGE_URL_START && draftTheme.heroImageUrl.startsWith(process.env.REACT_APP_IMAGE_URL_START) ? process.env.REACT_APP_BUCKET_URL + "" : "") + draftTheme.heroImageUrl) || ''} onImageChange={handleHeroSelect} onImageRemove={removeHero}/>
                <hr/>
                <div>
                    <label className="label-style">Nome Ristorante</label>
                    <input type="text" value={draftTheme.restaurantName} onChange={e => updateThemeValue('restaurantName', e.target.value)} className="input-style mt-1"/>
                </div>
                <div>
                    <label className="label-style">Indirizzo</label>
                    <input type="text" value={draftTheme.address} onChange={e => updateThemeValue('address', e.target.value)} className="input-style mt-1"/>
                </div>
                <div>
                    <label className="label-style">Telefono</label>
                    <input type="text" value={draftTheme.phone} onChange={e => updateThemeValue('phone', e.target.value)} className="input-style mt-1"/>
                </div>
                <div>
                    <label className="label-style">Link Facebook</label>
                    <input type="text" value={draftTheme.facebookUrl} onChange={e => updateThemeValue('facebookUrl', e.target.value)} className="input-style mt-1"/>
                </div>
                <div>
                    <label className="label-style">Link Instagram</label>
                    <input type="text" value={draftTheme.instagramUrl} onChange={e => updateThemeValue('instagramUrl', e.target.value)} className="input-style mt-1"/>
                </div>
            </div>
        )}
        {activeTab === 'layout' && (
            <div className="space-y-4">
                <ToggleInput label="Mostra Immagini nelle Card" checked={draftTheme.showImages} onChange={v => updateThemeValue('showImages', v)}/>
                <div>
                    <label className="label-style">Stile Angoli Card</label>
                    <select value={draftTheme.cardStyle} onChange={e => updateThemeValue('cardStyle', e.target.value)} className="input-style mt-1">
                        <option value="soft">Morbido (consigliato)</option>
                        <option value="rounded">Molto arrotondato</option>
                        <option value="sharp">Squadrato</option>
                    </select>
                </div>
            </div>
        )}
    </div>
);

// @ts-ignore
const PreviewPanel: React.FC<{
    backgroundCss: React.CSSProperties;
    draftTheme: StyleDto;
}> = ({ backgroundCss, draftTheme }) => (
    <div className="lg:col-span-2 rounded-xl p-2 md:p-4 flex justify-center items-center h-full" style={backgroundCss}>
        <div className="w-[375px] h-full max-h-[812px] bg-white rounded-3xl shadow-2xl overflow-hidden ring-4 ring-gray-800">
            <div className="w-full h-full overflow-y-auto" style={backgroundCss}>
                <MockHeader theme={draftTheme} />
                <main className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <MockCategoryCard theme={draftTheme} name="Pizze"/>
                        <MockCategoryCard theme={draftTheme} name="Panini"/>
                        <MockCategoryCard theme={draftTheme} name="Bibite"/>
                        <MockCategoryCard theme={draftTheme} name="Dessert"/>
                    </div>
                </main>
            </div>
        </div>
    </div>
);
// --- FINE MODIFICA CHIAVE ---


// --- Pagina di Personalizzazione Principale ---
const LayoutPage: React.FC = () => {
    const { updateStyle, styles, loading } = useData();
    const [draftTheme, setDraftTheme] = useState<StyleDto>(styles || {
        backgroundGradient: [], cardBackground: "#FFFFFF", primary: "#fb923c", textBody: "#6b7280",
        textOnPrimary: "#FFFFFF", textTitle: "#1f2937", address: "Via dei Sapori, 123",
        phone: "+39 012 345 6789", facebookUrl: "https://facebook.com", instagramUrl: "https://instagram.com",
        heroImageUrl: "/images/hero_placeholder.jpg", logoUrl: "/images/logo_placeholder.png",
        restaurantName: "Il Tuo Ristorante", cardStyle: "soft", showImages: true, font: "sans-serif"
    });

    const [activeTab, setActiveTab] = useState<'colors' | 'content' | 'layout'>('colors');
    const [activeMobileView, setActiveMobileView] = useState<'edit' | 'preview'>('edit');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        if (styles && !isDirty) {
            setDraftTheme(styles);
        }
    }, [styles, isDirty]);

    const backgroundCss = useMemo(() => {
        if (!draftTheme.backgroundGradient || draftTheme.backgroundGradient.length === 0) return { backgroundColor: '#F1F5F9' };
        if (draftTheme.backgroundGradient.length === 1) return { backgroundColor: draftTheme.backgroundGradient[0] };
        return { backgroundImage: `linear-gradient(to bottom right, ${draftTheme.backgroundGradient.join(', ')})` };
    }, [draftTheme.backgroundGradient]);

    const updateThemeValue = useCallback((key: keyof StyleDto, value: any) => {
        setDraftTheme(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    const handleBgColorChange = useCallback((index: number, value: string) => {
        const newColors = [...draftTheme.backgroundGradient];
        newColors[index] = value;
        updateThemeValue('backgroundGradient', newColors);
    }, [draftTheme.backgroundGradient, updateThemeValue]);

    const addBgColor = useCallback(() => {
        if (draftTheme.backgroundGradient.length < 3) {
            updateThemeValue('backgroundGradient', [...draftTheme.backgroundGradient, '#ffffff']);
        }
    }, [draftTheme.backgroundGradient, updateThemeValue]);

    const removeBgColor = useCallback((index: number) => {
        const newColors = draftTheme.backgroundGradient.filter((_, i) => i !== index);
        updateThemeValue('backgroundGradient', newColors);
    }, [draftTheme.backgroundGradient, updateThemeValue]);

    const handleLogoSelect = useCallback((file: File) => {
        setLogoFile(file);
        updateThemeValue('logoUrl', URL.createObjectURL(file));
    }, [updateThemeValue]);

    const handleHeroSelect = useCallback((file: File) => {
        setHeroFile(file);
        updateThemeValue('heroImageUrl', URL.createObjectURL(file));
    }, [updateThemeValue]);

    const handleSaveTheme = async () => {
        const payload: UpdateStyle = {
            ...draftTheme,
            backgroundGradient: draftTheme.backgroundGradient.join(";"),
            cardStyle: draftTheme.cardStyle as "soft" | "rounded" | "sharp"
        };
        const response = await updateStyle(payload, logoFile, heroFile);
        if(response) {
            addNotification({message: "Stile modificato", type: "success"});
            setLogoFile(null);
            setHeroFile(null);
            setIsDirty(false);
        } else {
            addNotification({message: "Errore durante il salvataggio dello stile", type: "error"});
        }
    };

    const removeHero = () => {
        setHeroFile(null)
        updateThemeValue('heroImageUrl', "DELETE")
    }

    const removeLogo = () => {
        setLogoFile(null)
        updateThemeValue('logoUrl', "DELETE")
    }

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col">
            {loading && <CustomLoading isFullPage={true}/>}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Personalizza Aspetto</h1>
                    <p className="text-gray-500 mt-1">Modifica l'aspetto del menu per i tuoi clienti in tempo reale.</p>
                </div>
                <button onClick={handleSaveTheme} disabled={!isDirty || loading} className="btn-primary flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <FaSave/><span>Salva Modifiche</span>
                </button>
            </div>

            {/* Ora i componenti vengono renderizzati passando le props necessarie */}
            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                <ControlPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    draftTheme={draftTheme}
                    updateThemeValue={updateThemeValue}
                    handleBgColorChange={handleBgColorChange}
                    removeBgColor={removeBgColor}
                    addBgColor={addBgColor}
                    handleLogoSelect={handleLogoSelect}
                    handleHeroSelect={handleHeroSelect}
                    removeLogo={removeLogo}
                    removeHero={removeHero}
                />
                <PreviewPanel
                    backgroundCss={backgroundCss}
                    draftTheme={draftTheme}
                />
            </div>

            {/* Logica per la vista mobile */}
            <div className="lg:hidden flex flex-col flex-grow mb-16">
                {activeMobileView === 'edit' ? (
                    <ControlPanel
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        draftTheme={draftTheme}
                        updateThemeValue={updateThemeValue}
                        handleBgColorChange={handleBgColorChange}
                        removeBgColor={removeBgColor}
                        addBgColor={addBgColor}
                        handleLogoSelect={handleLogoSelect}
                        handleHeroSelect={handleHeroSelect}
                        removeHero={removeHero}
                        removeLogo={removeLogo}
                    />
                ) : (
                    <PreviewPanel
                        backgroundCss={backgroundCss}
                        draftTheme={draftTheme}
                    />
                )}
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.1)] border-t z-40 flex justify-around">
                <button onClick={() => setActiveMobileView('edit')} className={`flex-1 flex flex-col items-center p-3 text-sm font-semibold transition-colors ${activeMobileView === 'edit' ? 'text-primary' : 'text-gray-500'}`}><PencilIcon className="w-6 h-6"/><span>Modifica</span></button>
                <button onClick={() => setActiveMobileView('preview')} className={`flex-1 flex flex-col items-center p-3 text-sm font-semibold transition-colors ${activeMobileView === 'preview' ? 'text-primary' : 'text-gray-500'}`}><EyeIcon className="w-6 h-6"/><span>Anteprima</span></button>
            </div>
        </div>
    );
};

export default LayoutPage;