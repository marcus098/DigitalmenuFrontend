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
                borderRadius: 'var(--menu-radius)',
                border: '1px solid var(--menu-border)',
                background: 'var(--menu-card)',
            }}
            whileHover={{
                scale: 1.025,
                boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
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

            {/* Readability scrim — image-backed cards always need contrast for the label */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.05) 100%)',
                }}
            />

            <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)' }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
            />

            {!imageUrl && (
                <div
                    className="absolute inset-0 flex items-center justify-center font-bold"
                    style={{
                        fontFamily: 'var(--menu-font-display)',
                        fontSize: 'clamp(3rem, 8vw, 5rem)',
                        color: 'rgba(255,255,255,0.18)',
                    }}
                >
                    {category.name.charAt(0).toUpperCase()}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h2
                    className="font-semibold leading-tight"
                    style={{
                        color: '#ffffff',
                        fontFamily: 'var(--menu-font-display)',
                        fontSize: 'clamp(1.15rem, 3.5vw, 1.5rem)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    }}
                >
                    {category.name}
                </h2>
                {category.description && (
                    <p
                        className="mt-0.5 line-clamp-1"
                        style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--menu-font-body)', fontSize: '0.7rem' }}
                    >
                        {category.description}
                    </p>
                )}
            </div>

            <motion.div
                className="absolute bottom-0 left-0 right-0"
                style={{
                    height: 2,
                    background: 'var(--menu-accent)',
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
