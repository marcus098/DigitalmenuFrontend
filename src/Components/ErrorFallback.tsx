import React from 'react';

type Props = {
    error: unknown;
    resetError: () => void;
};

const ErrorFallback: React.FC<Props> = ({ resetError }) => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl text-orange-600">
                    !
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Qualcosa è andato storto</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Si è verificato un errore imprevisto. Il nostro team è stato avvisato automaticamente.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={resetError}
                        className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                        Riprova
                    </button>
                    <button
                        type="button"
                        onClick={() => window.location.assign('/')}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Torna alla home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
