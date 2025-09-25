import React, { createContext, useContext, useReducer, useEffect } from 'react';
import covidData from './covidData';

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_SELECTED_COUNTRY: 'SET_SELECTED_COUNTRY',
  SET_SELECTED_DATA_TYPE: 'SET_SELECTED_DATA_TYPE',
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_DATA_FRESHNESS: 'SET_DATA_FRESHNESS'
};

// État initial mis à jour
const initialState = {
  // Données
  allData: null,
  globalStats: null,
  availableCountries: [],
  dataFreshness: null,
  
  loading: false,
  error: null,
  
  // Filtres et sélections - "active" remplace "recovered"
  selectedCountry: null,
  selectedDataType: 'confirmed', // confirmed, deaths, active
  dateRange: {
    start: null,
    end: null
  },
  
  lastUpdated: null
};

// Reducer pour gérer les changements d'état
function covidReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case ACTIONS.SET_DATA:
      return {
        ...state,
        allData: action.payload.allData,
        globalStats: action.payload.globalStats,
        availableCountries: action.payload.availableCountries,
        dataFreshness: action.payload.dataFreshness,
        lastUpdated: action.payload.lastUpdated,
        loading: false,
        error: null
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case ACTIONS.SET_SELECTED_COUNTRY:
      return {
        ...state,
        selectedCountry: action.payload
      };

    case ACTIONS.SET_SELECTED_DATA_TYPE:
      return {
        ...state,
        selectedDataType: action.payload
      };

    case ACTIONS.SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ACTIONS.SET_DATA_FRESHNESS:
      return {
        ...state,
        dataFreshness: action.payload
      };

    default:
      return state;
  }
}

const CovidContext = createContext();

export const useCovidData = () => {
  const context = useContext(CovidContext);
  if (!context) {
    throw new Error('useCovidData must be used within a CovidProvider');
  }
  return context;
};

export const CovidProvider = ({ children }) => {
  const [state, dispatch] = useReducer(covidReducer, initialState);

  const actions = {
    // Chargement des données
    loadAllData: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const [allData, globalStats, availableCountries, dataFreshness] = await Promise.all([
          covidData.getAllData(),
          covidData.getGlobalStats(),
          covidData.getAvailableCountries(),
          covidData.getDataFreshness()
        ]);

        dispatch({
          type: ACTIONS.SET_DATA,
          payload: {
            allData,
            globalStats,
            availableCountries,
            dataFreshness,
            lastUpdated: new Date().toISOString()
          }
        });

        if (dataFreshness.isStale) {
          console.warn('Attention: Les données COVID-19 ne sont plus mises à jour depuis mars 2023');
        }
        
      } catch (error) {
        dispatch({ 
          type: ACTIONS.SET_ERROR, 
          payload: `Erreur lors du chargement des données: ${error.message}` 
        });
      }
    },

    // Actualisation des données
    refreshData: async () => {
      covidData.clearCache();
      await actions.loadAllData();
    },

    // Sélection du pays
    selectCountry: (countryName) => {
      dispatch({ 
        type: ACTIONS.SET_SELECTED_COUNTRY, 
        payload: countryName 
      });
    },

    // Sélection du type de données - mise à jour pour exclure "recovered"
    selectDataType: (dataType) => {
      if (['confirmed', 'deaths', 'active'].includes(dataType)) {
        dispatch({ 
          type: ACTIONS.SET_SELECTED_DATA_TYPE, 
          payload: dataType 
        });
      }
    },

    // Définition de la plage de dates
    setDateRange: (startDate, endDate) => {
      dispatch({
        type: ACTIONS.SET_DATE_RANGE,
        payload: { start: startDate, end: endDate }
      });
    },

    // Effacer l'erreur
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    }
  };

  // Selectors - fonctions pour obtenir des données spécifiques
  const selectors = {
    // Données du pays sélectionné
    getSelectedCountryData: () => {
      if (!state.selectedCountry || !state.allData) return null;
      
      const countryData = {};
      Object.keys(state.allData).forEach(dataType => {
        if (dataType !== 'metadata') {
          const country = state.allData[dataType].countries[state.selectedCountry];
          if (country) {
            countryData[dataType] = country;
          }
        }
      });
      
      return countryData;
    },

    getGlobalDataByType: () => {
      if (!state.allData || !state.selectedDataType) return {};
      return state.allData[state.selectedDataType]?.global || {};
    },

    getDataInDateRange: (data) => {
      if (!state.dateRange.start || !state.dateRange.end || !data) {
        return data;
      }

      const filtered = {};
      Object.keys(data).forEach(date => {
        if (date >= state.dateRange.start && date <= state.dateRange.end) {
          filtered[date] = data[date];
        }
      });

      return filtered;
    },

    // Top N pays par type de données
    getTopCountries: (n = 10) => {
      if (!state.allData || !state.selectedDataType) return [];

      const countries = state.allData[state.selectedDataType]?.countries || {};
      const countriesArray = Object.keys(countries).map(countryName => {
        const countryData = countries[countryName];
        const dates = Object.keys(countryData.total).sort();
        const latestDate = dates[dates.length - 1];
        const latestValue = countryData.total[latestDate] || 0;

        return {
          name: countryName,
          value: latestValue,
          data: countryData
        };
      });

      return countriesArray
        .sort((a, b) => b.value - a.value)
        .slice(0, n);
    },

    // Calcul de la tendance (7 derniers jours)
    getTrend: (data) => {
      if (!data || typeof data !== 'object') return 0;

      const dates = Object.keys(data).sort();
      if (dates.length < 7) return 0;

      const recent = dates.slice(-7);
      const older = dates.slice(-14, -7);

      if (older.length === 0) return 0;

      const recentSum = recent.reduce((sum, date) => sum + (data[date] || 0), 0);
      const olderSum = older.reduce((sum, date) => sum + (data[date] || 0), 0);

      const recentAvg = recentSum / recent.length;
      const olderAvg = olderSum / older.length;

      if (olderAvg === 0) return recentAvg > 0 ? 1 : 0;

      return (recentAvg - olderAvg) / olderAvg;
    },

    getAvailableDataTypes: () => {
      return [
        { 
          value: 'confirmed', 
          label: 'Cas Confirmés', 
          description: 'Total des cas confirmés',
          available: true 
        },
        { 
          value: 'deaths', 
          label: 'Décès', 
          description: 'Total des décès',
          available: true 
        },
        { 
          value: 'active', 
          label: 'Cas Actifs', 
          description: 'Estimation: Confirmés - Décès',
          available: true 
        }
      ];
    },

    getDataAvailabilityInfo: () => {
      return {
        available: ['confirmed', 'deaths', 'active'],
        unavailable: ['recovered'],
        notes: {
          recovered: 'Données de guérisons arrêtées le 5 août 2021',
          active: 'Cas actifs = estimation basée sur Confirmés - Décès',
          lastUpdate: 'Toutes les données s\'arrêtent au 10 mars 2023'
        }
      };
    }
  };

  // Chargement initial des données
  useEffect(() => {
    if (!state.allData && !state.loading) {
      actions.loadAllData();
    }
  }, []);

  const contextValue = {
    ...state,
    ...actions,
    ...selectors,
    
    // Utilitaires
    isDataLoaded: !!state.allData,
    hasError: !!state.error,
    isEmpty: state.allData && Object.keys(state.allData).length === 0,
    isDataStale: state.dataFreshness?.isStale || false
  };

  return (
    <CovidContext.Provider value={contextValue}>
      {children}
    </CovidContext.Provider>
  );
};

// Hook pour les statistiques rapides - mis à jour
export const useCovidStats = () => {
  const { globalStats, selectedCountry, getSelectedCountryData } = useCovidData();

  if (selectedCountry) {
    const countryData = getSelectedCountryData();
    if (countryData) {
      // Calculer les stats pour le pays sélectionné
      const stats = {};
      Object.keys(countryData).forEach(dataType => {
        const dates = Object.keys(countryData[dataType].total).sort();
        const lastDate = dates[dates.length - 1];
        const prevDate = dates[dates.length - 2];

        stats[dataType] = {
          current: countryData[dataType].total[lastDate] || 0,
          daily: (countryData[dataType].total[lastDate] || 0) - 
                 (countryData[dataType].total[prevDate] || 0)
        };
      });
      return stats;
    }
  }

  return globalStats;
};

// Hook pour les avertissements de données obsolètes
export const useDataWarnings = () => {
  const { dataFreshness, isDataStale } = useCovidData();
  
  const getWarnings = () => {
    const warnings = [];
    
    if (isDataStale) {
      warnings.push({
        type: 'stale-data',
        severity: 'warning',
        message: 'Ces données ne sont plus mises à jour depuis mars 2023',
        details: dataFreshness?.warning
      });
    }
    
    warnings.push({
      type: 'missing-data',
      severity: 'info',
      message: 'Les données de guérisons ne sont plus disponibles',
      details: 'Remplacées par une estimation des cas actifs (Confirmés - Décès)'
    });
    
    return warnings;
  };
  
  return {
    warnings: getWarnings(),
    hasWarnings: getWarnings().length > 0,
    dataFreshness
  };
};

export default CovidContext;