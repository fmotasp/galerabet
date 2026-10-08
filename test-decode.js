const regex = /<!-- __BRAND_META__ ([\s\S]*?) -->/;
const raw = "<!-- __BRAND_META__ {\"colorPalette\":[{\"name\":\"Primária\",\"hex\":\"#E4007E\"}]} -->";
const match = raw.match(regex);
console.log(match ? JSON.parse(match[1]) : "No match");
