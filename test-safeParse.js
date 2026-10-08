const safeParse = (val, fallback) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

const brandMeta = { colorPalette: [{name: 'fallback', hex: '#000'}] };

console.log("null:", safeParse(null, brandMeta.colorPalette));
console.log("undefined:", safeParse(undefined, brandMeta.colorPalette));
console.log("objectObject:", safeParse("[object Object]", brandMeta.colorPalette));
console.log("emptyString:", safeParse("", brandMeta.colorPalette));
console.log("validJson:", safeParse('[{"name":"test","hex":"#fff"}]', brandMeta.colorPalette));

