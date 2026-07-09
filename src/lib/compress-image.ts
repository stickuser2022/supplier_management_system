/**
 * 客户端图片压缩：缩小 + 转 WebP。
 * 提取为独立函数，供 FileUploader 和 SupplierLogo 共用。
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1920;
    let w = bitmap.width;
    let h = bitmap.height;

    if (w > maxDim || h > maxDim) {
      if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
      else       { w = Math.round(w * maxDim / h); h = maxDim; }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/webp', 0.9),
    );
    const name = file.name.replace(/\.[^.]+$/, '.webp');
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}
