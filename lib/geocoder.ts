const COORDS: Record<string, [number, number]> = {
  // England - Oxfordshire
  "Wheatley, Oxfordshire, England": [51.7474, -1.1308],
  "Wheatley, Oxfordshire": [51.7474, -1.1308],
  "Great Milton, Oxfordshire, England": [51.719, -1.1078],
  "Great Milton, Oxfordshire": [51.719, -1.1078],
  "Holton, Oxfordshire, England": [51.757, -1.095],
  "Holton, Oxfordshire": [51.757, -1.095],
  "Oxford, Oxfordshire, England": [51.752, -1.2577],
  "Oxfordshire, England": [51.752, -1.2577],

  // England - Buckinghamshire
  "Dinton, Buckinghamshire, England": [51.7788, -0.8766],
  "Dinton, Buckinghamshire": [51.7788, -0.8766],
  "Buckinghamshire, England": [51.7788, -0.8766],
  "Bradenham, Buckinghamshire": [51.6677, -0.8262],
  "Pollicott, Buckinghamshire, England": [51.7883, -1.0192],
  "Pollicott, Buckinghamshire": [51.7883, -1.0192],
  "Ashendon, Buckinghamshire, England": [51.7883, -1.0192],
  "Ashendon, Buckinghamshire": [51.7883, -1.0192],
  "Stone, Buckinghamshire, England": [51.7949, -0.8121],
  "Stone, Buckinghamshire": [51.7949, -0.8121],

  // England - Shropshire (Billingsley)
  "Billingsley, Shropshire, England": [52.4847, -2.4467],
  "Billingsley, Shropshire": [52.4847, -2.4467],
  "Shropshire, England": [52.4847, -2.4467],

  // England - Warwickshire / Midlands
  "Coventry, Warwickshire, England": [52.4068, -1.5197],
  "Coventry, Warwickshire": [52.4068, -1.5197],

  // England - Hampshire
  "Durley, Hampshire, England": [50.9447, -1.235],
  "Durley, Hampshire": [50.9447, -1.235],
  "South Stoneham, Hampshire, England": [50.9356, -1.3742],
  "South Stoneham, Hampshire": [50.9356, -1.3742],
  "Droxford, Hampshire": [50.9541, -1.1508],
  "Droxford, Hampshire, England": [50.9541, -1.1508],

  // England - Norfolk / Suffolk
  "East Harling, Norfolk, England": [52.4468, 0.9677],
  "Banham, Norfolk, England": [52.4483, 1.0169],
  "Banham, Norfolk": [52.4483, 1.0169],
  "Palgrave, Suffolk": [52.3659, 1.0777],
  "Hinderclay, Suffolk": [52.3663, 1.0195],

  // England - London
  "London, England": [51.5074, -0.1278],
  "Liverpool, England": [53.4084, -2.9916],

  // England - Somerset
  "Bath, Somerset, England": [51.3811, -2.359],

  // Scotland
  "Carron Ironworks, Stirlingshire, Scotland": [56.0278, -3.8139],
  "Carron Ironworks, Scotland": [56.0278, -3.8139],
  "Edinburgh, Scotland": [55.9533, -3.1883],
  "Paisley, Scotland": [55.8466, -4.4239],
  "Kirknewton, West Lothian, Scotland": [55.8847, -3.5597],
  "Kirknewton, W. Lothian": [55.8847, -3.5597],

  // Denmark
  "Nykøbing Sjælland, Denmark": [55.9247, 11.67],
  "Denmark": [55.6761, 12.5683],

  // Germany
  "Germany": [51.1657, 10.4515],

  // USA - New York
  "Brooklyn, Kings, New York": [40.6782, -73.9442],
  "Brooklyn, New York": [40.6782, -73.9442],
  "New York": [40.7128, -74.006],

  // USA - Pennsylvania
  "Philadelphia, PA": [39.9526, -75.1652],
  "Pennsylvania": [40.5908, -77.2098],

  // USA - Idaho
  "Central, Bannock, Idaho": [42.2047, -112.0652],
  "Central, Idaho": [42.2047, -112.0652],

  // USA - Utah
  "Cedar City, Iron, Utah": [37.6775, -113.0619],
  "Cedar City, Utah": [37.6775, -113.0619],
  "Kanarraville, Iron, Utah": [37.5361, -113.1847],
  "Ogden, Weber, Utah": [41.223, -111.9738],
  "Ogden, Utah": [41.223, -111.9738],
  "Salt Lake City, Utah": [40.7608, -111.891],
  "SLC": [40.7608, -111.891],
  "St. George, Washington, Utah": [37.0965, -113.5684],
  "St. George, Utah": [37.0965, -113.5684],
  "Brigham City, Box Elder, Utah": [41.5102, -112.0155],
  "Brigham City, Utah": [41.5102, -112.0155],
  "Hooper, Weber, Utah": [41.1638, -112.123],
  "Hooper, Utah": [41.1638, -112.123],
  "Farr West, Weber, Utah": [41.2191, -112.0277],
  "Farr West, Utah": [41.2191, -112.0277],
  "Bountiful, Davis, Utah": [40.8894, -111.8808],
  "Bountiful, Utah": [40.8894, -111.8808],
  "Promontory, Box Elder, Utah": [41.6189, -112.5486],
  "Parowan, Iron, Utah": [37.8422, -112.828],
  "Escalante, Garfield, Utah": [37.77, -111.6022],
  "Escalante, Utah": [37.77, -111.6022],
  "Logan, Cache, Utah": [41.737, -111.8338],
  "Spanish Fork, Utah": [40.1149, -111.6549],
  "Utah": [39.321, -111.0937],
  "Weber, Utah": [41.223, -111.9738],

  // USA - Iowa
  "Iowa": [41.878, -93.0977],

  // USA - Maryland (Billingsley colonial)
  "Calvert County, Maryland": [38.5354, -76.5285],
  "St. Mary's County, Maryland": [38.2151, -76.5349],
  "Maryland": [39.0458, -76.6413],

  // USA - Virginia
  "Nansemond County, Virginia": [36.7268, -76.585],
  "Virginia": [37.4316, -78.6569],

  // USA - North Carolina
  "Guilford County, North Carolina": [36.0726, -79.7889],
  "North Carolina": [35.7596, -79.0193],

  // USA - Tennessee
  "Knoxville, Tennessee": [35.9606, -83.9207],
  "Bledsoe County, Tennessee": [35.5979, -85.3541],
  "Tennessee": [35.5175, -86.5804],

  // USA - Mississippi
  "Pontotoc County, Mississippi": [34.2484, -89.0037],

  // USA - Texas
  "Texas": [31.9686, -99.9018],

  // USA - Arizona
  "Bisbee, Arizona": [31.4478, -109.9284],

  // USA - Utah (additional)
  "Orderville, Utah": [37.2749, -112.6382],
  "Virgin City, Utah": [37.2063, -113.1833],
  "Grafton, Utah": [37.1696, -113.0794],
  "Hamilton Fort, Utah": [37.7261, -113.1997],
  "Provo, Utah": [40.2338, -111.6585],

  // Holland (Billingsley emigration)
  "Rotterdam, Holland": [51.9244, 4.4777],
  "Rotterdam, Netherlands": [51.9244, 4.4777],
};

export function geocode(place: string): [number, number] | null {
  if (!place) return null;

  // Direct lookup
  if (COORDS[place]) return COORDS[place];

  // Try partial matching - find the longest key that is contained in the place string
  const normalized = place.replace(/\s+/g, " ").trim();
  let bestMatch: [number, number] | null = null;
  let bestLen = 0;

  for (const [key, coords] of Object.entries(COORDS)) {
    if (
      normalized.toLowerCase().includes(key.toLowerCase()) &&
      key.length > bestLen
    ) {
      bestMatch = coords;
      bestLen = key.length;
    }
  }

  // Also try if any key contains the place
  if (!bestMatch) {
    for (const [key, coords] of Object.entries(COORDS)) {
      if (
        key.toLowerCase().includes(normalized.toLowerCase()) &&
        key.length > bestLen
      ) {
        bestMatch = coords;
        bestLen = key.length;
      }
    }
  }

  return bestMatch;
}
