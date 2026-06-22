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
                top: 57,
                background: 'color-mix(in srgb, var(--menu-bg) 92%, transparent)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--menu-border)',
            }}
        >
            <button
                onClick={() => navigate(`/${localname}`)}
                className="flex-shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{
                    width: 56,
                    height: 56,
                    color: 'var(--menu-muted)',
                    borderRight: '1px solid var(--menu-border)',
                }}
                aria-label="Torna alle categorie"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, zIndex: 1,
                    background: 'linear-gradient(to right, var(--menu-bg), transparent)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, zIndex: 1,
                    background: 'linear-gradient(to left, var(--menu-bg), transparent)',
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
                                className="whitespace-nowrap flex-shrink-0 rounded-full transition-all duration-200 active:scale-95"
                                style={{
                                    padding: '8px 20px',
                                    fontFamily: 'var(--menu-font-body)',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 700 : 500,
                                    letterSpacing: '0.02em',
                                    background: isActive ? primaryColor : 'transparent',
                                    color: isActive ? 'var(--menu-accent-text)' : 'var(--menu-muted)',
                                    border: isActive
                                        ? `1px solid ${primaryColor}`
                                        : '1px solid var(--menu-border)',
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
