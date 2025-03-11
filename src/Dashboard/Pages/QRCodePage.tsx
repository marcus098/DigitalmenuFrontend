import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodePage: React.FC = () => {
    const localUrl = "https://www.tuolocalewww.com"; // Sostituisci con l'URL del tuo locale
    const qrMessage = `QR Code per il tuo locale: ${localUrl}`;

    return (
        <div className="container mx-auto p-6 max-w-xl">
            <h1 className="text-3xl font-bold text-center mb-6">Il QR Code del Tuo Locale</h1>
            

            {/* QR Code */}
            <div className="flex justify-center mb-6">
                <QRCodeCanvas value={localUrl} size={256} />
            </div>

            {/* Descrizione */}
            <div className="text-center">
                <p className="text-sm text-gray-500">
                    {qrMessage}
                </p>
            </div>
        </div>
    );
};

export default QRCodePage;
