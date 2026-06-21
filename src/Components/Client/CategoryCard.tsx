import React from 'react';
import { motion } from 'framer-motion';
import { CategoryDto } from '../../types';

interface CategoryCardProps {
    category: CategoryDto;
    onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
    const hasImage = Boolean(category.image);
    const imageUrl = hasImage
        ? `${process.env.REACT_APP_BUCKET_URL}${category.image}`
        : null;

    const gradients = [
        'linear-gradient(135deg, #3d2b1f 0%, #6b3a2a 100%)',
        'linear-gradient(135deg, #1f2d3d 0%, #2a4a6b 100%)',
        'linear-gradient(135deg, #2d3320 0%, #4a5a30 100%)',
        'linear-gradient(135deg, #2d1f3d 0%, #4a2a6b 100%)',
        'linear-gradient(135deg, #3d2020 0%, #6b3030 100%)',
    ];
    const fallbackGradient = gradients[category.name.length % gradients.length];

    return (
        <motion.div
            onClick={onClick}
            className="relative overflow-hidden cursor-pointer"
            style={{
                aspectRatio: '3 / 4',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
            whileHover={{
                scale: 1.025,
                boxShadow: '0 20px 40px rgba(0,0,0,0.55)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
            {/* Image or gradient fallback */}
            {imageUrl ? (
                <motion.img
                    src={imageUrl}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1.06 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.08 }}
                    onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <div className="absolute inset-0" style={{ background: fallbackGradient }} />
            )}

            {/* Dark overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.08) 100%)',
                }}
            />

            {/* Shimmer on hover */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
                }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
            />

            {/* Fallback letter */}
            {!imageUrl && (
                <div
                    className="absolute inset-0 flex items-center justify-center font-cormorant font-bold"
                    style={{
                        fontSize: 'clamp(3rem, 8vw, 5rem)',
                        color: 'rgba(255,255,255,0.12)',
                    }}
                >
                    {category.name.charAt(0).toUpperCase()}
                </div>
            )}

            {/* Category name */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h2
                    className="font-cormorant font-semibold leading-tight"
                    style={{
                        color: '#ede8da',
                        fontSize: 'clamp(1.15rem, 3.5vw, 1.5rem)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    }}
                >
                    {category.name}
                </h2>
                {category.description && (
                    <p
                        className="font-nunito mt-0.5 line-clamp-1"
                        style={{ color: 'rgba(237,232,218,0.55)', fontSize: '0.7rem' }}
                    >
                        {category.description}
                    </p>
                )}
            </div>

            {/* Accent bar on hover */}
            <motion.div
                className="absolute bottom-0 left-0 right-0"
                style={{
                    height: 2,
                    background: 'var(--c-accent, #f97316)',
                    originX: 0,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                whileHover={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            />
        </motion.div>
    );
};

export default CategoryCard;
