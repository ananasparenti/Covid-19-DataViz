'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  fetchCovidData, 
  getTimeSeriesData, 
  getTopCountries,
  fetchCountryData,
  fetchHistoricalData,
  searchCountries,
  calculateRates 
} from '@/lib/covidAPI';

// Types d'actions
const actionTypes = {
  LOADING: 'LOADING',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  SET_SELECTED_COUNTRY: 'SET_SELECTED_COUNTRY',
  SET_TIME_RANGE: 'SET_TIME_RANGE',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_CONTINENT_FILTER: 'SET_CONTINENT_FILTER'
};

// État initial
const initialState = {
  loading: false,
  error: null,
  global: null,
  countries: [],
  timeSeries: [],
  topCountries: [],
  selectedCountry: null,
  timeRange: 30,
  searchQuery: '',
  continentFilter: '',
  lastUpdate: null,
  filteredCountries: []
};

// Reducer
function covidReducer(state, action) {
  switch (action.type) {
    case actionTypes.LOADING:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case actionTypes.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        global: action.payload.global,
        countries: action.payload.countries,
        timeSeries: action.payload.timeSeries,
        topCountries: action.payload.topCountries,
        lastUpdate: action.payload.lastUpdate,
        filteredCountries: action.payload.countries
      };
    
    case actionTypes.FETCH_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case actionTypes.SET_SELECTED_COUNTRY:
      return {
        ...state,
        selectedCountry: action.payload
      };
    
    case actionTypes.SET_TIME_RANGE:
      return {
        ...state,
        timeRange: action.payload
      };
    
    case actionTypes.SET_SEARCH_QUERY:
      const filteredBySearch = action.payload 
        ? searchCountries(state.countries, action.payload)
        : state.countries;
      
      return {
        ...state,
        searchQuery: action.payload,
        filteredCountries: filteredBySearch
      };
    
    case actionTypes.SET_CONTINENT_FILTER:
      const filteredByContinent = action.payload 
        ? state.countries.filter(country => 
            country.continent && country.continent.toLowerCase() === action.payload.toLowerCase()
          )
        : state.countries;
      
      return {
        ...state,
        continentFilter: action.payload,
        filteredCountries: filteredByContinent
      };
    
    default:
      return state;
  }
}

// Context
const CovidContext = createContext();

// Provider
export function CovidProvider({ children }) {
  const [state, dispatch] = useReducer(covidReducer, initialState);

  // Fonction pour charger les données
  const loadData = async () => {
    dispatch({ type: actionTypes.LOADING });
    
    try {
      const data = await fetchCovidData();
      const topCountries = getTopCountries(data.countries, 10);
      
      dispatch({
        type: actionTypes.FETCH_SUCCESS,
        payload: {
          global: data.global,
          countries: data.countries,
          timeSeries: data.timeSeries,
          topCountries,
          lastUpdate: data.lastUpdate
        }
      });
    } catch (error) {
      dispatch({
        type: actionTypes.FETCH_ERROR,
        payload: error.message
      });
    }
  };

  // Fonction pour sélectionner un pays
  const selectCountry = async (countryName) => {
    if (!countryName) {
      dispatch({
        type: actionTypes.SET_SELECTED_COUNTRY,
        payload: null
      });
      return;
    }

    try {
      const countryData = await fetchCountryData(countryName);
      dispatch({
        type: actionTypes.SET_SELECTED_COUNTRY,
        payload: countryData
      });
    } catch (error) {
      console.error('Error selecting country:', error);
    }
  };

  // Fonction pour changer la plage temporelle
  const setTimeRange = async (days) => {
    dispatch({ type: actionTypes.SET_TIME_RANGE, payload: days });
    
    try {
      const newTimeSeries = await fetchHistoricalData(days);
      dispatch({
        type: actionTypes.FETCH_SUCCESS,
        payload: {
          ...state,
          timeSeries: newTimeSeries,
          timeRange: days
        }
      });
    } catch (error) {
      console.error('Error updating time range:', error);
    }
  };

  // Fonction pour rechercher des pays
  const setSearchQuery = (query) => {
    dispatch({
      type: actionTypes.SET_SEARCH_QUERY,
      payload: query
    });
  };

  // Fonction pour filtrer par continent
  const setContinentFilter = (continent) => {
    dispatch({
      type: actionTypes.SET_CONTINENT_FILTER,
      payload: continent
    });
  };

  // Fonction pour obtenir les statistiques avec taux calculés
  const getGlobalStatsWithRates = () => {
    if (!state.global) return null;
    
    const rates = calculateRates(state.global);
    return {
      ...state.global,
      ...rates
    };
  };

  // Fonction pour obtenir les pays triés par différents critères
  const getTopCountriesByCriteria = (criteria = 'confirmed', limit = 10) => {
    return getTopCountries(state.countries, limit, criteria);
  };

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  const value = {
    // État
    ...state,
    
    // Actions
    loadData,
    selectCountry,
    setTimeRange,
    setSearchQuery,
    setContinentFilter,
    
    // Fonctions utilitaires
    getGlobalStatsWithRates,
    getTopCountriesByCriteria,
    
    // Données calculées
    globalWithRates: getGlobalStatsWithRates()
  };

  return (
    <CovidContext.Provider value={value}>
      {children}
    </CovidContext.Provider>
  );
}

export function useCovid() {
  const context = useContext(CovidContext);
  if (!context) {
    throw new Error('useCovid must be used within a CovidProvider');
  }
  return context;
}