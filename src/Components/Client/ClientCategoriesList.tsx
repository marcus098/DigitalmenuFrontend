import React from 'react';
import { motion } from 'framer-motion';
import CategoryCard from './CategoryCard';
import { CategoryDto } from '../../types';

interface ClientCategoriesListProps {
    categories: CategoryDto[];
    onSelectCategory: (categoryId: number) => void;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 28, scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

const ClientCategoriesList: React.FC<ClientCategoriesListProps> = ({
    categories,
    onSelectCategory,
}) => {
    const visible = categories.filter(c => c.id > 0 && c.available);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3 md:gap-4"
            style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 46%), 1fr))',
            }}
        >
            {visible.map(category => (
                <motion.div key={category.id} variants={item}>
                    <CategoryCard
                        category={category}
                        onClick={() => onSelectCategory(category.id)}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default ClientCategoriesList;
