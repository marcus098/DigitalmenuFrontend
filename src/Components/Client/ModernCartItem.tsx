import React from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../../types';
import { useData } from '../../Context/DataContext';
import { Trash2, Minus, Plus } from 'lucide-react';

interface ModernCartItemProps {
    item: ProductCard;
    onRemove: () => void;
    onQuantityChange: (newQuantity: number) => void;
}

const ModernCartItem: React.FC<ModernCartItemProps> = ({
    item,
    onRemove,
    onQuantityChange,
}) => {
    const { productsMap, ingredientsMap } = useData();
    const product = productsMap.get(item.id);

    const imageUrl = product?.image
        ? `${process.env.REACT_APP_BUCKET_URL}${product.image}`
        : null;

    const totalItemPrice = item.price * item.quantity;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4"
            style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#1e1b15',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* Image */}
            <div
                className="flex-shrink-0 overflow-hidden"
                style={{ width: 72, height: 72, borderRadius: 10 }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product?.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center font-cormorant font-bold text-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #2d2820 0%, #3d3428 100%)',
                            color: 'rgba(237,232,218,0.2)',
                        }}
                    >
                        {(product?.name || 'P').charAt(0)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p
                    className="font-cormorant font-semibold leading-snug"
                    style={{ color: '#ede8da', fontSize: '1.05rem' }}
                >
                    {product?.name}
                </p>
                <p
                    className="font-nunito font-semibold mt-0.5"
                    style={{ color: 'var(--c-accent, #f97316)', fontSize: '0.82rem' }}
                >
                    €{item.price.toFixed(2)} cad.
                </p>

                {/* Customizations */}
                <div className="mt-1 space-y-0.5">
                    {item.optionName !== 'default' && (
                        <p className="font-nunito text-xs" style={{ color: '#8a7d6a' }}>
                            Opzione:{' '}
                            <span style={{ color: '#ede8da' }}>{item.optionName}</span>
                        </p>
                    )}
                    {item.ingredientsPlus.length > 0 && (
                        <p className="font-nunito text-xs" style={{ color: '#4ade80' }}>
                            +{' '}
                            {item.ingredientsPlus
                                .map(id => ingredientsMap.get(id)?.name)
                                .join(', ')}
                        </p>
                    )}
                    {item.ingredientsMinus.length > 0 && (
                        <p className="font-nunito text-xs" style={{ color: '#f87171' }}>
                            −{' '}
                            {item.ingredientsMinus
                                .map(id => ingredientsMap.get(id)?.name)
                                .join(', ')}
                        </p>
                    )}
                    {item.note && (
                        <p className="font-nunito text-xs italic" style={{ color: '#8a7d6a' }}>
                            "{item.note}"
                        </p>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 flex flex-col items-end gap-3">
                {/* Quantity */}
                <div
                    className="flex items-center gap-2"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 99,
                        padding: '4px 10px',
                    }}
                >
                    <motion.button
                        onClick={() => onQuantityChange(item.quantity - 1)}
                        whileTap={{ scale: 0.85 }}
                        className="flex items-center justify-center"
                        style={{ color: '#8a7d6a', width: 20, height: 20 }}
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    <span
                        className="font-nunito font-bold tabular-nums"
                        style={{ color: '#ede8da', minWidth: 18, textAlign: 'center', fontSize: '0.9rem' }}
                    >
                        {item.quantity}
                    </span>
                    <motion.button
                        onClick={() => onQuantityChange(item.quantity + 1)}
                        whileTap={{ scale: 0.85 }}
                        className="flex items-center justify-center"
                        style={{ color: '#8a7d6a', width: 20, height: 20 }}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                </div>

                {/* Total */}
                <span
                    className="font-cormorant font-bold"
                    style={{ color: '#ede8da', fontSize: '1.15rem' }}
                >
                    €{totalItemPrice.toFixed(2)}
                </span>

                {/* Remove */}
                <motion.button
                    onClick={onRemove}
                    whileHover={{ color: '#f87171' }}
                    whileTap={{ scale: 0.9 }}
                    style={{ color: 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ModernCartItem;
