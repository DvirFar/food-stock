import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { settingsService, type Category, type Location, type ProductTag } from '@/services/settingsService';

interface SettingsContextType {
  categories: Category[];
  locations: Location[];
  productTags: ProductTag[];
  categoryLabels: Record<string, string>;
  locationLabels: Record<string, string>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      let [cats, locs, tags] = await Promise.all([
        settingsService.getCategories(),
        settingsService.getLocations(),
        settingsService.getProductTags(),
      ]);
      
      if (cats.length === 0) {
        try { cats = await settingsService.initializeDefaultCategories(); } catch (e) { console.error('Error initializing default categories:', e); }
      }
      if (locs.length === 0) {
        try { locs = await settingsService.initializeDefaultLocations(); } catch (e) { console.error('Error initializing default locations:', e); }
      }
      if (tags.length === 0) {
        try { tags = await settingsService.initializeDefaultProductTags(); } catch (e) { console.error('Error initializing default product tags:', e); }
      }

      setCategories(cats);
      setLocations(locs);
      setProductTags(tags);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setCategories([]);
      setLocations([]);
      setProductTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const categoryLabels = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.label;
    return acc;
  }, {} as Record<string, string>);

  const locationLabels = locations.reduce((acc, loc) => {
    acc[loc.name] = loc.label;
    return acc;
  }, {} as Record<string, string>);

  return (
    <SettingsContext.Provider value={{
      categories,
      locations,
      productTags,
      categoryLabels,
      locationLabels,
      loading,
      refetch: fetchSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
