// Alternative API approach using disease.sh which aggregates Johns Hopkins data
// This is more reliable and doesn't have CORS issues

/**
 * Service API COVID-19 utilisant disease.sh
 * Cette API agrège les données de Johns Hopkins de manière plus fiable
 */

const BASE_URL = 'https://disease.sh/v3/covid-19';

/**
 * Récupère les statistiques globales
 */
export async function fetchGlobalStats() {
  try {
    const response = await fetch(`${BASE_URL}/all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return {
      confirmed: data.cases,
      deaths: data.deaths,
      recovered: data.recovered,
      active: data.active,
      todayCases: data.todayCases,
      todayDeaths: data.todayDeaths,
      critical: data.critical,
      lastUpdate: new Date(data.updated).toLocaleDateString('fr-FR')
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
}

/**
 * Récupère les données de tous les pays
 */
export async function fetchCountriesData() {
  try {
    const response = await fetch(`${BASE_URL}/countries`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.map(country => ({
      country: country.country,
      countryInfo: country.countryInfo,
      confirmed: country.cases,
      deaths: country.deaths,
      recovered: country.recovered,
      active: country.active,
      todayCases: country.todayCases,
      todayDeaths: country.todayDeaths,
      todayRecovered: country.todayRecovered,
      critical: country.critical,
      population: country.population,
      continent: country.continent,
      flag: country.countryInfo?.flag
    }));
  } catch (error) {
    console.error('Error fetching countries data:', error);
    throw error;
  }
}

/**
 * Récupère les données historiques globales
 */
export async function fetchHistoricalData(days = 30) {
  try {
    const response = await fetch(`${BASE_URL}/historical/all?lastdays=${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Transformer les données en format série temporelle
    const dates = Object.keys(data.cases);
    return dates.map(date => ({
      date,
      confirmed: data.cases[date],
      deaths: data.deaths[date],
      recovered: data.recovered[date],
      active: data.cases[date] - data.deaths[date] - data.recovered[date]
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
}

/**
 * Récupère les données historiques pour un pays spécifique
 */
export async function fetchCountryHistoricalData(country, days = 30) {
  try {
    const response = await fetch(`${BASE_URL}/historical/${country}?lastdays=${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.timeline) {
      const dates = Object.keys(data.timeline.cases);
      return dates.map(date => ({
        date,
        confirmed: data.timeline.cases[date],
        deaths: data.timeline.deaths[date],
        recovered: data.timeline.recovered[date],
        active: data.timeline.cases[date] - data.timeline.deaths[date] - data.timeline.recovered[date]
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching historical data for ${country}:`, error);
    throw error;
  }
}

/**
 * Récupère les données par continent
 */
export async function fetchContinentsData() {
  try {
    const response = await fetch(`${BASE_URL}/continents`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.map(continent => ({
      continent: continent.continent,
      confirmed: continent.cases,
      deaths: continent.deaths,
      recovered: continent.recovered,
      active: continent.active,
      todayCases: continent.todayCases,
      todayDeaths: continent.todayDeaths,
      critical: continent.critical,
      population: continent.population,
      countries: continent.countries
    }));
  } catch (error) {
    console.error('Error fetching continents data:', error);
    throw error;
  }
}

/**
 * Fonction principale qui récupère toutes les données nécessaires
 */
export async function fetchCovidData() {
  try {
    console.log('Fetching COVID-19 data...');
    
    // Récupérer les données en parallèle
    const [globalStats, countriesData, historicalData] = await Promise.all([
      fetchGlobalStats(),
      fetchCountriesData(),
      fetchHistoricalData(30)
    ]);
    
    console.log('Data fetched successfully');
    
    return {
      global: globalStats,
      countries: countriesData,
      timeSeries: historicalData,
      lastUpdate: globalStats.lastUpdate
    };
    
  } catch (error) {
    console.error('Error fetching COVID data:', error);
    throw error;
  }
}

/**
 * Récupère les données pour un pays spécifique
 */
export async function fetchCountryData(countryName) {
  try {
    const response = await fetch(`${BASE_URL}/countries/${countryName}`);
    if (!response.ok) {
      throw new Error(`Country ${countryName} not found`);
    }
    const data = await response.json();
    
    return {
      country: data.country,
      countryInfo: data.countryInfo,
      confirmed: data.cases,
      deaths: data.deaths,
      recovered: data.recovered,
      active: data.active,
      todayCases: data.todayCases,
      todayDeaths: data.todayDeaths,
      todayRecovered: data.todayRecovered,
      critical: data.critical,
      population: data.population,
      continent: data.continent,
      flag: data.countryInfo?.flag
    };
  } catch (error) {
    console.error(`Error fetching data for ${countryName}:`, error);
    throw error;
  }
}

/**
 * Récupère les données pour une période spécifique
 */
export function getTimeSeriesData(historicalData, days = 30) {
  if (!historicalData || historicalData.length === 0) {
    return [];
  }
  
  // Prendre les derniers 'days' jours
  return historicalData.slice(-days);
}

/**
 * Récupère le top des pays par cas confirmés
 */
export function getTopCountries(countriesData, limit = 10, sortBy = 'confirmed') {
  if (!countriesData || countriesData.length === 0) {
    return [];
  }
  
  const sortedCountries = [...countriesData].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });
  
  return sortedCountries.slice(0, limit);
}

/**
 * Filtre les pays par continent
 */
export function getCountriesByContinent(countriesData, continent) {
  if (!countriesData || countriesData.length === 0) {
    return [];
  }
  
  return countriesData.filter(country => 
    country.continent && country.continent.toLowerCase() === continent.toLowerCase()
  );
}

/**
 * Calcule les taux (mortalité, guérison, etc.)
 */
export function calculateRates(data) {
  const { confirmed, deaths, recovered } = data;
  
  if (confirmed === 0) {
    return {
      mortalityRate: 0,
      recoveryRate: 0,
      activeRate: 0
    };
  }
  
  return {
    mortalityRate: ((deaths / confirmed) * 100).toFixed(2),
    recoveryRate: ((recovered / confirmed) * 100).toFixed(2),
    activeRate: (((confirmed - deaths - recovered) / confirmed) * 100).toFixed(2)
  };
}

/**
 * Recherche des pays par nom
 */
export function searchCountries(countriesData, query) {
  if (!countriesData || countriesData.length === 0 || !query) {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase();
  return countriesData.filter(country => 
    country.country.toLowerCase().includes(lowercaseQuery)
  );
}