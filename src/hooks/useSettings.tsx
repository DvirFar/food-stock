import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { settingsService, Category, Location, defaultCategories, defaultLocations } from '@/services/settingsService';

interface SettingsContextType {
  categories: Category[];
  locations: Location[];
  categoryLabels: Record<string, string>;
  locationLabels: Record<string, string>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, locs] = await Promise.all([
        settingsService.getCategories(),
        settingsService.getLocations(),
      ]);
      
      // If no categories/locations exist, use defaults (but don't create them yet)
      setCategories(cats.length > 0 ? cats : defaultCategories.map((c, i) => ({
        ...c,
        id: `default-${i}`,
        user_id: '',
        created_at: new Date().toISOString(),
      })));
      setLocations(locs.length > 0 ? locs : defaultLocations.map((l, i) => ({
        ...l,
        id: `default-${i}`,
        user_id: '',
        created_at: new Date().toISOString(),
      })));
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fall back to defaults on error
      setCategories(defaultCategories.map((c, i) => ({
        ...c,
        id: `default-${i}`,
        user_id: '',
        created_at: new Date().toISOString(),
      })));
      setLocations(defaultLocations.map((l, i) => ({
        ...l,
        id: `default-${i}`,
        user_id: '',
        created_at: new Date().toISOString(),
      })));
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
