const DB_NAME = 'bias-timer-images';
const STORE_NAME = 'photos';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function resize(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('이미지를 처리할 수 없습니다.'));
      const scale = Math.max(256 / image.width, 256 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (256 - width) / 2, (256 - height) / 2, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('이미지를 저장할 수 없습니다.'));
      }, 'image/webp', 0.85);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('올바른 이미지 파일이 아닙니다.')); };
    image.src = url;
  });
}

export async function savePhoto(file: File, id = crypto.randomUUID()) {
  const db = await openDb();
  const blob = await resize(file);
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
  return id;
}

export async function getPhoto(id: string): Promise<string | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deletePhoto(id: string | null) {
  if (!id) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}
