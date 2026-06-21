import React from 'react';
import { useCookieConsent } from '../../Context/CookieConsentContext';

type Props = {
    className?: string;
    children?: React.ReactNode;
};

// Drop this anywhere in a footer/profile menu so users can change consent later.
// Required by GDPR — consent must be as easy to withdraw as to give.
const ManageCookiesLink: React.FC<Props> = ({ className, children }) => {
    const { openPreferences, hasDecided, reopenBanner } = useCookieConsent();

    const handleClick = () => {
        if (hasDecided) openPreferences();
        else reopenBanner();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={className ?? 'text-sm underline underline-offset-2 hover:opacity-80'}
        >
            {children ?? 'Gestisci cookie'}
        </button>
    );
};

export default ManageCookiesLink;
