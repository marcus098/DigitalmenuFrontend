import {useData} from '../Context/DataContext';

/**
 * Testi fissi del menu cliente (pulsanti, etichette) nelle lingue offerte dai locali.
 * Nomi e descrizioni dei piatti arrivano invece dalle traduzioni del locale (DataContext).
 */
const STRINGS = {
    allergens: {it: 'Allergeni', en: 'Allergens', de: 'Allergene', fr: 'Allergènes', es: 'Alérgenos', nl: 'Allergenen', pl: 'Alergeny', pt: 'Alergénios', zh: '过敏原'},
    allergensFilter: {it: 'Filtra per allergeni', en: 'Filter by allergens', de: 'Nach Allergenen filtern', fr: 'Filtrer par allergènes', es: 'Filtrar por alérgenos', nl: 'Filteren op allergenen', pl: 'Filtruj alergeny', pt: 'Filtrar por alergénios', zh: '按过敏原筛选'},
    order: {it: 'Ordine', en: 'Order', de: 'Bestellung', fr: 'Commande', es: 'Pedido', nl: 'Bestelling', pl: 'Zamówienie', pt: 'Pedido', zh: '订单'},
    language: {it: 'Lingua del menu', en: 'Menu language', de: 'Sprache der Speisekarte', fr: 'Langue du menu', es: 'Idioma del menú', nl: 'Taal van het menu', pl: 'Język menu', pt: 'Idioma do menu', zh: '菜单语言'},
    mayContainTraces: {it: 'Può contenere tracce di', en: 'May contain traces of', de: 'Kann Spuren enthalten von', fr: 'Peut contenir des traces de', es: 'Puede contener trazas de', nl: 'Kan sporen bevatten van', pl: 'Może zawierać śladowe ilości', pt: 'Pode conter vestígios de', zh: '可能含有微量'},
    noAllergens: {it: 'Nessun allergene dichiarato', en: 'No allergens declared', de: 'Keine Allergene angegeben', fr: 'Aucun allergène déclaré', es: 'Ningún alérgeno declarado', nl: 'Geen allergenen opgegeven', pl: 'Brak zadeklarowanych alergenów', pt: 'Nenhum alergénio declarado', zh: '未声明过敏原'},
    frozen: {it: "Prodotto surgelato o congelato all'origine", en: 'Frozen product or frozen at source', de: 'Tiefgekühltes oder an der Quelle gefrorenes Produkt', fr: "Produit surgelé ou congelé à l'origine", es: 'Producto ultracongelado o congelado en origen', nl: 'Diepgevroren of bij de bron ingevroren product', pl: 'Produkt głęboko mrożony lub mrożony u źródła', pt: 'Produto ultracongelado ou congelado na origem', zh: '速冻或原产地冷冻产品'},
    allergenFilterTitle: {it: 'Filtra allergeni', en: 'Allergen filter', de: 'Allergenfilter', fr: 'Filtre allergènes', es: 'Filtro de alérgenos', nl: 'Allergenenfilter', pl: 'Filtr alergenów', pt: 'Filtro de alergénios', zh: '过敏原筛选'},
    allergenFilterHelp: {
        it: 'Seleziona gli allergeni da escludere. I piatti che li contengono verranno nascosti dal menù; quelli che possono contenerne tracce restano visibili con un avviso.',
        en: 'Select the allergens to avoid. Dishes containing them will be hidden; dishes that may contain traces stay visible with a warning.',
        de: 'Wählen Sie die Allergene aus, die Sie meiden möchten. Gerichte, die sie enthalten, werden ausgeblendet; Gerichte, die Spuren enthalten können, bleiben mit einem Hinweis sichtbar.',
        fr: 'Sélectionnez les allergènes à éviter. Les plats qui en contiennent seront masqués ; ceux qui peuvent en contenir des traces restent visibles avec un avertissement.',
        es: 'Selecciona los alérgenos que quieres evitar. Los platos que los contienen se ocultarán; los que pueden contener trazas seguirán visibles con un aviso.',
        nl: 'Kies de allergenen die je wilt vermijden. Gerechten die ze bevatten worden verborgen; gerechten die sporen kunnen bevatten blijven zichtbaar met een waarschuwing.',
        pl: 'Wybierz alergeny, których chcesz unikać. Dania, które je zawierają, zostaną ukryte; dania, które mogą zawierać ich śladowe ilości, pozostaną widoczne z ostrzeżeniem.',
        pt: 'Selecione os alergénios a evitar. Os pratos que os contêm serão ocultados; os que podem conter vestígios continuam visíveis com um aviso.',
        zh: '请选择需要避免的过敏原。含有这些过敏原的菜品将被隐藏；可能含有微量的菜品仍会显示并附带提示。',
    },
    reset: {it: 'Resetta', en: 'Reset', de: 'Zurücksetzen', fr: 'Réinitialiser', es: 'Restablecer', nl: 'Wissen', pl: 'Wyczyść', pt: 'Repor', zh: '重置'},
    applyFilters: {it: 'Applica filtri', en: 'Apply', de: 'Anwenden', fr: 'Appliquer', es: 'Aplicar', nl: 'Toepassen', pl: 'Zastosuj', pt: 'Aplicar', zh: '应用'},
    close: {it: 'Chiudi', en: 'Close', de: 'Schließen', fr: 'Fermer', es: 'Cerrar', nl: 'Sluiten', pl: 'Zamknij', pt: 'Fechar', zh: '关闭'},
    allergenFooter: {
        it: 'Allergeni indicati secondo il Reg. UE 1169/2011. Per informazioni su allergeni e ingredienti chiedi al personale.',
        en: 'Allergens listed according to EU Regulation 1169/2011. Please ask our staff for information on allergens and ingredients.',
        de: 'Allergene gemäß EU-Verordnung 1169/2011. Für Informationen zu Allergenen und Zutaten wenden Sie sich bitte an unser Personal.',
        fr: 'Allergènes indiqués selon le Règlement UE 1169/2011. Pour toute information sur les allergènes et les ingrédients, demandez au personnel.',
        es: 'Alérgenos indicados según el Reglamento UE 1169/2011. Para información sobre alérgenos e ingredientes, pregunte al personal.',
        nl: 'Allergenen vermeld volgens EU-verordening 1169/2011. Vraag ons personeel om informatie over allergenen en ingrediënten.',
        pl: 'Alergeny podane zgodnie z rozporządzeniem UE 1169/2011. Informacji o alergenach i składnikach udziela personel.',
        pt: 'Alergénios indicados segundo o Regulamento UE 1169/2011. Para informações sobre alergénios e ingredientes, pergunte ao pessoal.',
        zh: '过敏原依据欧盟第1169/2011号法规标注。如需了解过敏原和配料信息，请咨询工作人员。',
    },
} as const;

/**
 * Nomi dei 14 allergeni (Reg. UE 1169/2011, Allegato II) nelle versioni linguistiche del regolamento,
 * scritti a mano: è un'informazione di sicurezza, non va tradotta in automatico. [nome completo, etichetta breve]
 */
const ALLERGEN_NAMES: Record<string, Record<number, [string, string]>> = {
    en: {1: ['Cereals containing gluten', 'Gluten'], 2: ['Crustaceans', 'Crustaceans'], 3: ['Eggs', 'Eggs'], 4: ['Fish', 'Fish'], 5: ['Peanuts', 'Peanuts'], 6: ['Soybeans', 'Soy'], 7: ['Milk', 'Milk'], 8: ['Nuts', 'Nuts'], 9: ['Celery', 'Celery'], 10: ['Mustard', 'Mustard'], 11: ['Sesame seeds', 'Sesame'], 12: ['Sulphur dioxide and sulphites', 'Sulphites'], 13: ['Lupin', 'Lupin'], 14: ['Molluscs', 'Molluscs']},
    de: {1: ['Glutenhaltiges Getreide', 'Gluten'], 2: ['Krebstiere', 'Krebstiere'], 3: ['Eier', 'Eier'], 4: ['Fisch', 'Fisch'], 5: ['Erdnüsse', 'Erdnüsse'], 6: ['Sojabohnen', 'Soja'], 7: ['Milch', 'Milch'], 8: ['Schalenfrüchte', 'Nüsse'], 9: ['Sellerie', 'Sellerie'], 10: ['Senf', 'Senf'], 11: ['Sesamsamen', 'Sesam'], 12: ['Schwefeldioxid und Sulphite', 'Sulfite'], 13: ['Lupinen', 'Lupinen'], 14: ['Weichtiere', 'Weichtiere']},
    fr: {1: ['Céréales contenant du gluten', 'Gluten'], 2: ['Crustacés', 'Crustacés'], 3: ['Œufs', 'Œufs'], 4: ['Poissons', 'Poisson'], 5: ['Arachides', 'Arachides'], 6: ['Soja', 'Soja'], 7: ['Lait', 'Lait'], 8: ['Fruits à coque', 'Fruits à coque'], 9: ['Céleri', 'Céleri'], 10: ['Moutarde', 'Moutarde'], 11: ['Graines de sésame', 'Sésame'], 12: ['Anhydride sulfureux et sulfites', 'Sulfites'], 13: ['Lupin', 'Lupin'], 14: ['Mollusques', 'Mollusques']},
    es: {1: ['Cereales que contienen gluten', 'Gluten'], 2: ['Crustáceos', 'Crustáceos'], 3: ['Huevos', 'Huevos'], 4: ['Pescado', 'Pescado'], 5: ['Cacahuetes', 'Cacahuetes'], 6: ['Soja', 'Soja'], 7: ['Leche', 'Leche'], 8: ['Frutos de cáscara', 'Frutos secos'], 9: ['Apio', 'Apio'], 10: ['Mostaza', 'Mostaza'], 11: ['Granos de sésamo', 'Sésamo'], 12: ['Dióxido de azufre y sulfitos', 'Sulfitos'], 13: ['Altramuces', 'Altramuces'], 14: ['Moluscos', 'Moluscos']},
    nl: {1: ['Glutenbevattende granen', 'Gluten'], 2: ['Schaaldieren', 'Schaaldieren'], 3: ['Eieren', 'Ei'], 4: ['Vis', 'Vis'], 5: ["Aardnoten (pinda's)", 'Pinda'], 6: ['Soja', 'Soja'], 7: ['Melk', 'Melk'], 8: ['Noten', 'Noten'], 9: ['Selderij', 'Selderij'], 10: ['Mosterd', 'Mosterd'], 11: ['Sesamzaad', 'Sesam'], 12: ['Zwaveldioxide en sulfieten', 'Sulfiet'], 13: ['Lupine', 'Lupine'], 14: ['Weekdieren', 'Weekdieren']},
    pl: {1: ['Zboża zawierające gluten', 'Gluten'], 2: ['Skorupiaki', 'Skorupiaki'], 3: ['Jaja', 'Jaja'], 4: ['Ryby', 'Ryby'], 5: ['Orzeszki ziemne (arachidowe)', 'Orzeszki ziemne'], 6: ['Soja', 'Soja'], 7: ['Mleko', 'Mleko'], 8: ['Orzechy', 'Orzechy'], 9: ['Seler', 'Seler'], 10: ['Gorczyca', 'Gorczyca'], 11: ['Nasiona sezamu', 'Sezam'], 12: ['Dwutlenek siarki i siarczyny', 'Siarczyny'], 13: ['Łubin', 'Łubin'], 14: ['Mięczaki', 'Mięczaki']},
    pt: {1: ['Cereais que contêm glúten', 'Glúten'], 2: ['Crustáceos', 'Crustáceos'], 3: ['Ovos', 'Ovos'], 4: ['Peixes', 'Peixe'], 5: ['Amendoins', 'Amendoins'], 6: ['Soja', 'Soja'], 7: ['Leite', 'Leite'], 8: ['Frutos de casca rija', 'Frutos de casca rija'], 9: ['Aipo', 'Aipo'], 10: ['Mostarda', 'Mostarda'], 11: ['Sementes de sésamo', 'Sésamo'], 12: ['Dióxido de enxofre e sulfitos', 'Sulfitos'], 13: ['Tremoço', 'Tremoço'], 14: ['Moluscos', 'Moluscos']},
    zh: {1: ['含麸质的谷物', '麸质'], 2: ['甲壳类动物', '甲壳类'], 3: ['蛋类', '蛋'], 4: ['鱼类', '鱼'], 5: ['花生', '花生'], 6: ['大豆', '大豆'], 7: ['奶及奶制品', '奶'], 8: ['坚果', '坚果'], 9: ['芹菜', '芹菜'], 10: ['芥末', '芥末'], 11: ['芝麻', '芝麻'], 12: ['二氧化硫和亚硫酸盐', '亚硫酸盐'], 13: ['羽扇豆', '羽扇豆'], 14: ['软体动物', '软体动物']},
};

/** Nome dell'allergene nella lingua del menu; null = usa il nome italiano canonico. */
export const allergenName = (id: number, lang: string, short = false): string | null => {
    const entry = ALLERGEN_NAMES[lang]?.[id];
    return entry ? entry[short ? 1 : 0] : null;
};

export type MenuStringKey = keyof typeof STRINGS;

export const menuText = (key: MenuStringKey, lang: string): string => {
    const entry = STRINGS[key] as Record<string, string>;
    return entry[lang] ?? entry.it;
};

/** t('order') nella lingua scelta dal cliente; italiano se manca la traduzione. */
export const useMenuT = () => {
    const {menuLang} = useData();
    return (key: MenuStringKey) => menuText(key, menuLang);
};
