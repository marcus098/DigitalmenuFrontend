import React from 'react';
import { motion } from 'framer-motion';
import { ProductDto } from '../../types';
import { Plus } from 'lucide-react';

interface ProductListItemProps {
    product: ProductDto;
    onClick: () => void;
}

const TAG_STYLES: Record<number, { bg: string; color: string; label: string }> = {
    1: { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', label: '🌿 Veg' },
    2: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Senza Glutine' },
    3: { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: '🌶 Piccante' },
    4: { bg: 'rgba(201,168,76,0.15)', color: '#c9a84c', label: '⭐ Classico' },
};

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick }) => {
    const imageUrl = product.image
        ? `${process.env.REACT_APP_BUCKET_URL}${product.image}`
        : null;

    const displayPrice =
        product.options && product.options.length > 0 ? product.options[0].price : 0;
    const hasMultipleOptions = product.options && product.options.length > 1;

    return (
        <motion.div
            onClick={onClick}
            className="flex items-center gap-4 cursor-pointer"
            style={{
                padding: '16px',
                borderRadius: 'var(--menu-radius)',
                border: '1px solid var(--menu-border)',
                background: 'var(--menu-card)',
            }}
            whileHover={{
                y: -2,
                boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            }}
            whileTap={{ scale: 0.99, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        >
            <div
                className="flex-shrink-0 overflow-hidden"
                style={{ width: 88, height: 88, borderRadius: 12 }}
            >
                {imageUrl ? (
                    <motion.img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.32, ease: 'easeOut' }}
                        onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center font-bold"
                        style={{
                            background: 'var(--menu-surface)',
                            color: 'var(--menu-muted)',
                            fontFamily: 'var(--menu-font-display)',
                            opacity: 0.4,
                            fontSize: '2rem',
                        }}
                    >
                        {product.name.charAt(0)}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3
                    className="font-semibold leading-snug"
                    style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: 'clamp(1.05rem, 3vw, 1.2rem)' }}
                >
                    {product.name}
                </h3>

                {product.description && (
                    <p
                        className="mt-0.5 line-clamp-2"
                        style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.78rem', lineHeight: 1.45 }}
                    >
                        {product.description}
                    </p>
                )}

                {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {product.tags.slice(0, 3).map(tag => {
                            const ts = TAG_STYLES[tag] || {
                                bg: 'var(--menu-input-bg)',
                                color: 'var(--menu-muted)',
                                label: String(tag),
                            };
                            return (
                                <span
                                    key={tag}
                                    style={{
                                        fontFamily: 'var(--menu-font-body)',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: 99,
                                        background: ts.bg,
                                        color: ts.color,
                                        letterSpacing: '0.03em',
                                    }}
                                >
                                    {ts.label}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div>
                    <span
                        className="font-bold leading-none"
                        style={{
                            color: 'var(--menu-accent)',
                            fontFamily: 'var(--menu-font-display)',
                            fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)',
                        }}
                    >
                        €{displayPrice.toFixed(2)}
                    </span>
                    {hasMultipleOptions && (
                        <p
                            className="text-right"
                            style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.65rem', marginTop: 1 }}
                        >
                            da
                        </p>
                    )}
                </div>

                <motion.div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 32, height: 32 }}
                    initial={{ background: 'var(--menu-input-bg)', color: 'var(--menu-muted)' }}
                    whileHover={{
                        background: 'var(--menu-accent)',
                        color: 'var(--menu-accent-text)',
                        scale: 1.18,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                    <Plus className="w-4 h-4" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ProductListItem;
