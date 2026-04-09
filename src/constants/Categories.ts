export type Category = {
  id: string;
  labelFr: string;
  labelEn: string;
  icon: string;
};

export const Categories: Category[] = [
  { id: 'vetements', labelFr: 'Vêtements', labelEn: 'Clothing', icon: 'shirt' },
  { id: 'chaussures', labelFr: 'Chaussures', labelEn: 'Shoes', icon: 'footprints' },
  { id: 'vehicules', labelFr: 'Véhicules', labelEn: 'Vehicles', icon: 'car' },
  { id: 'electronique', labelFr: 'Électronique', labelEn: 'Electronics', icon: 'smartphone' },
  { id: 'maison', labelFr: 'Maison', labelEn: 'Home', icon: 'home' },
  { id: 'sport', labelFr: 'Sport', labelEn: 'Sport', icon: 'dumbbell' },
  { id: 'luxe', labelFr: 'Luxe', labelEn: 'Luxury', icon: 'gem' },
  { id: 'enfants', labelFr: 'Enfants', labelEn: 'Kids', icon: 'baby' },
  { id: 'beaute', labelFr: 'Beauté', labelEn: 'Beauty', icon: 'sparkles' },
  { id: 'bricolage', labelFr: 'Bricolage', labelEn: 'DIY', icon: 'wrench' },
  { id: 'autre', labelFr: 'Autre', labelEn: 'Other', icon: 'grid' },
];
