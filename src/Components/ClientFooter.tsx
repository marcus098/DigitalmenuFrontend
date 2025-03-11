import React from 'react';

interface SocialLink {
    platform: string;
    url: string;
    icon: string;
}

interface ClientFooterProps {
    address: string;
    phone: string;
    socialLinks: SocialLink[];
}

const ClientFooter: React.FC<ClientFooterProps> = ({ address, phone, socialLinks }) => {
    return (
        <footer className="bg-gray-100 py-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">{address}</p>
            <p className="text-gray-600">
                Phone: <a href={`tel:${phone}`} className="text-blue-500 hover:underline">{phone}</a>
            </p>
            <div className="flex justify-center space-x-4 mt-4">
                {socialLinks.map((link) => (
                    <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-75 transition duration-200"
                    >
                        <img src={link.icon} alt={`${link.platform} icon`} className="w-6 h-6" />
                    </a>
                ))}
            </div>
        </footer>
    );
};

export default ClientFooter;
