/**
 * Riduce una foto lato browser prima dell'upload (lato lungo max `maxSide` px, WebP/JPEG ~0.85).
 * Le foto dei telefoni pesano spesso 5-10 MB: così l'upload è più veloce e resta sotto il limite
 * del backend, che poi la converte comunque in WebP. Se qualcosa va storto restituisce il file originale.
 */
export async function downscaleImage(file: File, maxSide = 2000, quality = 0.85): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

    let bitmap: { width: number; height: number; source: CanvasImageSource; close?: () => void } | null = null;
    try {
        if (typeof createImageBitmap === 'function') {
            // from-image: applica la rotazione EXIF delle foto scattate col telefono (default diverso nei browser vecchi)
            const b = await createImageBitmap(file, { imageOrientation: 'from-image' });
            bitmap = { width: b.width, height: b.height, source: b, close: () => b.close() };
        } else {
            const url = URL.createObjectURL(file);
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = reject;
                el.src = url;
            }).finally(() => URL.revokeObjectURL(url));
            bitmap = { width: img.naturalWidth, height: img.naturalHeight, source: img };
        }
    } catch {
        return file;
    }

    const { width, height } = bitmap;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    // Già piccola e leggera: niente ricompressione.
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) { bitmap.close?.(); return file; }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close?.(); return file; }
    try {
        ctx.drawImage(bitmap.source, 0, 0, canvas.width, canvas.height);
    } catch {
        return file;
    } finally {
        bitmap.close?.();
    }

    const toBlob = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob('image/webp');
    let ext = 'webp';
    if (!blob || blob.type !== 'image/webp') {
        // Senza WebP (es. Safari): PNG resta PNG per non perdere la trasparenza (il JPEG la renderebbe nera)
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
        blob = await toBlob(keepAlpha ? 'image/png' : 'image/jpeg');
        ext = keepAlpha ? 'png' : 'jpg';
    }
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    return new File([blob], name, { type: blob.type, lastModified: Date.now() });
}
