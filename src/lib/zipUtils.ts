// Pure in-browser ZIP packager with CRC32 (Standard PKZip format - No external dependencies)

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  name: string;
  data: Uint8Array;
}

export function createZipBlob(files: ZipFileEntry[]): Blob {
  const fileRecords: {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
  }[] = [];

  const localHeadersAndData: Uint8Array[] = [];
  let currentOffset = 0;

  const textEncoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const size = data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    // Signature: PK\x03\x04 (0x04034b50)
    view.setUint32(0, 0x04034b50, true);
    // Version needed: 2.0 (20)
    view.setUint16(4, 20, true);
    // General purpose flag: UTF-8
    view.setUint16(6, 0x0800, true);
    // Compression method: 0 (STORE - uncompressed)
    view.setUint16(8, 0, true);
    // Last mod time / date
    view.setUint16(10, 0x4800, true);
    view.setUint16(12, 0x5461, true);
    // CRC-32
    view.setUint32(14, crc, true);
    // Compressed size
    view.setUint32(18, size, true);
    // Uncompressed size
    view.setUint32(22, size, true);
    // File name length
    view.setUint16(26, nameBytes.length, true);
    // Extra field length: 0
    view.setUint16(28, 0, true);

    // File name
    localHeader.set(nameBytes, 30);

    fileRecords.push({
      nameBytes,
      data,
      crc,
      compressedSize: size,
      uncompressedSize: size,
      localHeaderOffset: currentOffset,
    });

    localHeadersAndData.push(localHeader);
    localHeadersAndData.push(data);

    currentOffset += localHeader.length + data.length;
  }

  // Central Directory
  const centralDirStart = currentOffset;
  const centralDirRecords: Uint8Array[] = [];

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    // Signature: PK\x01\x02 (0x02014b50)
    view.setUint32(0, 0x02014b50, true);
    // Version made by: 20
    view.setUint16(4, 20, true);
    // Version needed: 20
    view.setUint16(6, 20, true);
    // General purpose flag: UTF-8
    view.setUint16(8, 0x0800, true);
    // Compression method: 0
    view.setUint16(10, 0, true);
    // Last mod time / date
    view.setUint16(12, 0x4800, true);
    view.setUint16(14, 0x5461, true);
    // CRC-32
    view.setUint32(16, record.crc, true);
    // Compressed size
    view.setUint32(20, record.compressedSize, true);
    // Uncompressed size
    view.setUint32(24, record.uncompressedSize, true);
    // File name length
    view.setUint16(28, record.nameBytes.length, true);
    // Extra field length: 0
    view.setUint16(30, 0, true);
    // File comment length: 0
    view.setUint16(32, 0, true);
    // Disk number start: 0
    view.setUint16(34, 0, true);
    // Internal file attributes: 0
    view.setUint16(36, 0, true);
    // External file attributes: 0
    view.setUint32(38, 0, true);
    // Relative offset of local header
    view.setUint32(42, record.localHeaderOffset, true);

    // File name
    cdHeader.set(record.nameBytes, 46);
    centralDirRecords.push(cdHeader);
    currentOffset += cdHeader.length;
  }

  const centralDirSize = currentOffset - centralDirStart;

  // End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  // Signature: PK\x05\x06 (0x06054b50)
  eocdView.setUint32(0, 0x06054b50, true);
  // Number of this disk: 0
  eocdView.setUint16(4, 0, true);
  // Disk where central directory starts: 0
  eocdView.setUint16(6, 0, true);
  // Total entries on this disk
  eocdView.setUint16(8, fileRecords.length, true);
  // Total entries
  eocdView.setUint16(10, fileRecords.length, true);
  // Central directory size
  eocdView.setUint32(12, centralDirSize, true);
  // Offset of central directory
  eocdView.setUint32(16, centralDirStart, true);
  // Comment length: 0
  eocdView.setUint16(20, 0, true);

  const allParts: (Uint8Array | Blob)[] = [
    ...localHeadersAndData,
    ...centralDirRecords,
    eocd,
  ];

  return new Blob(allParts, { type: 'application/zip' });
}

// Convert any URL / DataURL / Google Drive Link to Uint8Array
export async function fetchFileAsBytes(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const base64Str = parts[1];
      const binaryStr = atob(base64Str);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes;
    }

    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      const buf = await response.arrayBuffer();
      return new Uint8Array(buf);
    }
    const buf = await response.arrayBuffer();
    return new Uint8Array(buf);
  } catch (err) {
    console.warn('Failed to fetch file as bytes for zip:', url, err);
    return null;
  }
}

// Download a blob to user's computer
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
