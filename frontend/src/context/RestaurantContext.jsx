import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'SMART DINE',
    description: 'Dynamic Restaurant System',
    address: '',
    phone: '',
    email: '',
    opening_hours: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchRestaurantInfo = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/restaurant');
      if (res.data && Object.keys(res.data).length > 0) {
        setRestaurantInfo(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurant info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantInfo();
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        restaurantInfo,
        loading,
        refreshRestaurantInfo: fetchRestaurantInfo
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export default RestaurantContext;
