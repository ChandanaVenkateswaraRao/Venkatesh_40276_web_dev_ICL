import { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [city, setCity] = useState(localStorage.getItem('userCity') || 'Mumbai');

  useEffect(() => {
    localStorage.setItem('userCity', city);
  }, [city]);

  return (
    <LocationContext.Provider value={{ city, setCity }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
