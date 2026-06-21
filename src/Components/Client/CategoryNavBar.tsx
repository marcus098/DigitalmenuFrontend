import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CategoryDto } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface CategoryNavBarProps {
    categories: CategoryDto[];
    activeCategoryId: number;
    onSelectCategory: (categoryId: number) => void;
    primaryColor: string;
}

const CategoryNavBar: React.FC<CategoryNavBarProps> = ({
    categories,
    activeCategoryId,
    onSelectCategory,
    primaryColor,
}) => {
    const navigate = useNavigate();
    const { localname } = useParams();
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    /* scroll active pill into view on category change */
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [activeCategoryId]);

    const visible = categories.filter(c => c.available !== false);

    return (
        <div
            className="sticky z-20 flex items-center gap-0"
            style={{
                top: 57,                                   /* below main header */
                background: 'rgba(20, 17, 12, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* Back button */}
            <button
                onClick={() => navigate(`/${localname}`)}
                className="flex-shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{
                    width: 56,
                    height: 56,
                    color: '#8a7d6a',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ede8da')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a7d6a')}
                aria-label="Torna alle categorie"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Scrollable pills — min-width:0 prevents flex overflow */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                {/* Left fade */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, zIndex: 1,
                    background: 'linear-gradient(to right, rgba(20,17,12,0.96), transparent)',
                    pointerEvents: 'none',
                }} />
                {/* Right fade */}
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, zIndex: 1,
                    background: 'linear-gradient(to left, rgba(20,17,12,0.96), transparent)',
                    pointerEvents: 'none',
                }} />
            <div
                ref={scrollRef}
                className="menu-nav-scroll flex items-center gap-2"
                style={{ overflowX: 'auto', padding: '10px 16px' }}
            >
                {visible.map(cat => {
                    const isActive = cat.id === activeCategoryId;
                    return (
                        <button
                            key={cat.id}
                            ref={isActive ? activeRef : null}
                            onClick={() => onSelectCategory(cat.id)}
                            className="font-nunito whitespace-nowrap flex-shrink-0 rounded-full transition-all duration-200 active:scale-95"
                            style={{
                                padding: '8px 20px',
                                fontSize: '0.8rem',
                                fontWeight: isActive ? 700 : 500,
                                letterSpacing: '0.02em',
                                background: isActive ? primaryColor : 'transparent',
                                color: isActive ? '#fff' : '#8a7d6a',
                                border: isActive
                                    ? `1px solid ${primaryColor}`
                                    : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isActive ? `0 0 18px ${primaryColor}55` : 'none',
                                minHeight: 36,
                            }}
                        >
                            {cat.name}
                        </button>
                    );
                })}
            </div>
            </div>
        </div>
    );
};

export default CategoryNavBar;
