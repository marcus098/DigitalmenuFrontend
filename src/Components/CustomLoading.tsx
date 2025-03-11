import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface CustomLoadingProps {
    isFullPage?: boolean; // Se true, il loading coprirà tutta la pagina
    isTransparent?: boolean; // Se true, sfondo semi-trasparente grigio
    message?: string; // Messaggio personalizzabile durante il caricamento
}

const CustomLoading: React.FC<CustomLoadingProps> = ({
                                                         isFullPage = false,
                                                         isTransparent = false,
                                                         message = 'Cooking something delicious...',
                                                     }) => {
    // Determina le classi per lo sfondo
    const containerClasses = `
        fixed inset-0 z-50
        ${isTransparent ? 'bg-gray-500 bg-opacity-50 flex justify-center items-center' : ''}
        ${isFullPage && !isTransparent ? 'bg-white flex justify-center items-center' : ''}
    `;

    const contentClasses = `
        ${isFullPage || isTransparent ? 'p-8 rounded-md shadow-lg' : ''}
        flex flex-col items-center
    `;

    return (
        <div className={containerClasses}>
            <div className={contentClasses}>
                {/* Animazione con Lottie */}
                <DotLottieReact
                    src="https://lottie.host/628b4934-32fa-4bd0-bd39-eb515f9a2479/nompZkZwXA.lottie"
                    loop
                    autoplay
                    style={{ width: 150, height: 150 }}
                />
                <span className="mt-4 text-center">{message}</span>
            </div>
        </div>
    );
};

export default CustomLoading;
