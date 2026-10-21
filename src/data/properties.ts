import { photo } from "../lib/assets";

export type Category = "Coastal" | "City" | "Countryside";
export type Property = {
  id: string;
  title: string;
  location: string;
  category: Category;
  price: number;
  priceLabel: string;
  beds: number;
  baths: number;
  area: number;
  tag: string;
  description: string;
  features: string[];
  images: { src: string; alt: string }[];
};

export const properties: Property[] = [
  {
    id: "the-palm-residence", title: "The Palm Residence", location: "Palm Springs, California", category: "Countryside",
    price: 4250000, priceLabel: "$4,250,000", beds: 4, baths: 5, area: 4200, tag: "Architectural escape",
    description: "An exploration of desert modernism, imagined around the simple pleasure of a slower day. Floor-to-ceiling glass connects generous living spaces to a private courtyard and sunlit pool. A palette of natural stone and warm timber lets the landscape take the lead.",
    features: ["Private swimming pool", "Floor-to-ceiling glazing", "Landscaped courtyard", "Four bedroom suites", "Outdoor entertaining", "Natural stone finishes"],
    images: [
      { src: photo("photo-1600596542815-ffad4c1539a9", 1600), alt: "Contemporary white residence framed by a landscaped garden and pool" },
      { src: photo("photo-1600607687920-4e2a09cf159d", 1400), alt: "Light-filled contemporary interior with natural materials" },
      { src: photo("photo-1600210492486-724fe5c67fb0", 1400), alt: "Open living room with warm neutral furniture" }
    ]
  },
  {
    id: "casa-del-sol", title: "Casa del Sol", location: "Malibu, California", category: "Coastal",
    price: 6800000, priceLabel: "$6,800,000", beds: 5, baths: 6, area: 5800, tag: "Coastal living",
    description: "A coastal retreat concept shaped by light, openness, and the rhythm of the Pacific. Expansive terraces dissolve the boundaries between inside and out, while a secluded pool creates an intimate place to gather. Designed for long lunches and unhurried weekends.",
    features: ["Wraparound sun terrace", "Private pool", "Open-plan living", "Five bedroom suites", "Indoor-outdoor dining", "Generous entertaining spaces"],
    images: [
      { src: photo("photo-1613977257363-707ba9348227", 1600), alt: "Expansive modern villa with a terrace and private swimming pool" },
      { src: photo("photo-1600566753086-00f18fb6b3ea", 1400), alt: "Refined light interior with an open plan" },
      { src: photo("photo-1600607687939-ce8a6c25118c", 1400), alt: "Contemporary kitchen and dining space" }
    ]
  },
  {
    id: "the-olive-house", title: "The Olive House", location: "Montecito, California", category: "Countryside",
    price: 3950000, priceLabel: "$3,950,000", beds: 3, baths: 4, area: 3600, tag: "A quieter perspective",
    description: "An intimate countryside home concept where considered architecture meets an effortless California sensibility. Sunlit interiors, a sheltered garden, and a beautifully restrained material palette offer a grounded alternative to the everyday.",
    features: ["Secluded garden", "Natural timber details", "Three bedroom suites", "Private study", "Covered terrace", "Open-plan kitchen"],
    images: [
      { src: photo("photo-1600585154340-be6161a56a0c", 1600), alt: "Warm modern house opening onto a green garden" },
      { src: photo("photo-1600210492486-724fe5c67fb0", 1400), alt: "Neutral living room with layered textures" },
      { src: photo("photo-1600607687920-4e2a09cf159d", 1400), alt: "Thoughtful interior with natural light" }
    ]
  },
  {
    id: "the-westbourne", title: "The Westbourne", location: "West Hollywood, California", category: "City",
    price: 2850000, priceLabel: "$2,850,000", beds: 3, baths: 3, area: 2850, tag: "City sanctuary",
    description: "An urban sanctuary concept with a quietly confident point of view. Layered living spaces, tactile materials, and a private terrace bring a sense of calm to the city. A home for those who want to be connected to everything, without giving up a place to retreat.",
    features: ["Private terrace", "Bespoke kitchen", "Three bedrooms", "Dedicated workspace", "Natural material palette", "Open living and dining"],
    images: [
      { src: photo("photo-1600607687939-ce8a6c25118c", 1600), alt: "Refined contemporary urban home with a spacious kitchen" },
      { src: photo("photo-1600210492486-724fe5c67fb0", 1400), alt: "Light and spacious urban living room" },
      { src: photo("photo-1600566753086-00f18fb6b3ea", 1400), alt: "Contemporary interior styled with warm natural tones" }
    ]
  }
];

export const heroSlides = [
  { propertyId: "the-palm-residence", image: properties[0].images[0], title: "The Palm Residence", location: "PALM SPRINGS, CALIFORNIA" },
  { propertyId: "casa-del-sol", image: properties[1].images[0], title: "Casa del Sol", location: "MALIBU, CALIFORNIA" },
  { propertyId: "the-olive-house", image: properties[2].images[0], title: "The Olive House", location: "MONTECITO, CALIFORNIA" }
];
