import {
    ChefHat, UtensilsCrossed, Pizza, Sandwich, Beef, Fish, Wheat, Leaf,
    Carrot, Wine, Beer, Coffee, IceCream, Cake, Flame, Heart, Star, Award,
    Truck, ShoppingBag, Clock, MapPin, Users, Sparkles, Zap, Smartphone,
    Apple, Cookie, Soup, Croissant,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Catalogo icone disponibili per le "feature card" della landing.
 * Le chiavi sono stabili e vengono salvate nel campo `icon` della feature.
 * Aggiungerne è sicuro: le vecchie chiavi continuano a risolversi e le emoji
 * legacy (es. "🥩") sono mostrate come testo via fallback in FeatureIcon.
 */
export const FEATURE_ICONS: { key: string; label: string; Cmp: LucideIcon }[] = [
    { key: 'chef-hat',         label: 'Chef',         Cmp: ChefHat },
    { key: 'utensils-crossed', label: 'Cucina',       Cmp: UtensilsCrossed },
    { key: 'pizza',            label: 'Pizza',        Cmp: Pizza },
    { key: 'sandwich',         label: 'Panino',       Cmp: Sandwich },
    { key: 'croissant',        label: 'Pasticceria',  Cmp: Croissant },
    { key: 'soup',             label: 'Zuppa',        Cmp: Soup },
    { key: 'beef',             label: 'Carne',        Cmp: Beef },
    { key: 'fish',             label: 'Pesce',        Cmp: Fish },
    { key: 'wheat',            label: 'Pane / Grano', Cmp: Wheat },
    { key: 'leaf',             label: 'Fresco / Bio', Cmp: Leaf },
    { key: 'carrot',           label: 'Vegetali',     Cmp: Carrot },
    { key: 'apple',            label: 'Frutta',       Cmp: Apple },
    { key: 'wine',             label: 'Vino',         Cmp: Wine },
    { key: 'beer',             label: 'Birra',        Cmp: Beer },
    { key: 'coffee',           label: 'Caffè',        Cmp: Coffee },
    { key: 'ice-cream',        label: 'Gelato',       Cmp: IceCream },
    { key: 'cake',             label: 'Dolci',        Cmp: Cake },
    { key: 'cookie',           label: 'Biscotti',     Cmp: Cookie },
    { key: 'flame',            label: 'Grill',        Cmp: Flame },
    { key: 'heart',            label: 'Passione',     Cmp: Heart },
    { key: 'star',             label: 'Qualità',      Cmp: Star },
    { key: 'award',            label: 'Premiato',     Cmp: Award },
    { key: 'sparkles',         label: 'Speciale',     Cmp: Sparkles },
    { key: 'truck',            label: 'Delivery',     Cmp: Truck },
    { key: 'shopping-bag',     label: 'Asporto',      Cmp: ShoppingBag },
    { key: 'clock',            label: 'Veloce',       Cmp: Clock },
    { key: 'zap',              label: 'Rapidità',     Cmp: Zap },
    { key: 'map-pin',          label: 'Km Zero',      Cmp: MapPin },
    { key: 'users',            label: 'Famiglia',     Cmp: Users },
    { key: 'smartphone',       label: 'QR Code',      Cmp: Smartphone },
];

export const FEATURE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
    FEATURE_ICONS.map(i => [i.key, i.Cmp])
);
