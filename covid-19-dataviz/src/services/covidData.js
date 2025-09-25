const COVID_DATA_URLS = {
  confirmed: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
  deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'
  // Note: recovered data discontinued since August 5, 2021
};

class CovidData {
  constructor() {
    this.cache = new Map();
    this.lastFetch = null;
    this.cacheTimeout = 1000 * 60 * 60;
  }

  /**
   * Récupère les données CSV depuis une URL
   * @param {string} url - URL du fichier CSV
   * @returns {Promise<string>} - Contenu CSV brut
   */
  async fetchCSV(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Erreur lors du fetch de ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse un CSV et le convertit en tableau d'objets
   * @param {string} csvText - Texte CSV brut
   * @returns {Array} - Tableau d'objets représentant les données
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Parse une ligne CSV en gérant les guillemets et virgules
   * @param {string} line - Ligne CSV
   * @returns {Array} - Valeurs parsées
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Transforme les données brutes en structure de séries temporelles
   * @param {Array} rawData - Données brutes du CSV
   * @param {string} dataType - Type de données (confirmed, deaths)
   * @returns {Object} - Données transformées
   */
  transformToTimeSeries(rawData, dataType) {
    const timeSeries = {
      dataType,
      lastUpdated: new Date().toISOString(),
      countries: {},
      global: {},
      totalsByDate: {}
    };

    // Identifier les colonnes de dates (commencent par un chiffre)
    const dateColumns = Object.keys(rawData[0] || {}).filter(key => {
      return /^\d+\/\d+\/\d+$/.test(key);
    });

    // Traiter chaque ligne (pays/région)
    rawData.forEach(row => {
      const country = row['Country/Region'] || row.Country || 'Unknown';
      const province = row['Province/State'] || row.Province || '';
      const lat = parseFloat(row.Lat) || 0;
      const long = parseFloat(row.Long) || 0;

      // Initialiser le pays s'il n'existe pas
      if (!timeSeries.countries[country]) {
        timeSeries.countries[country] = {
          name: country,
          provinces: {},
          total: {},
          coordinates: { lat, long }
        };
      }

      // Données pour cette région/province
      const regionData = {
        name: province || country,
        coordinates: { lat, long },
        data: {}
      };

      // Traiter chaque date
      dateColumns.forEach(date => {
        const value = parseInt(row[date]) || 0;
        const formattedDate = this.formatDate(date);
        
        regionData.data[formattedDate] = value;

        // Agrégation par pays
        if (!timeSeries.countries[country].total[formattedDate]) {
          timeSeries.countries[country].total[formattedDate] = 0;
        }
        timeSeries.countries[country].total[formattedDate] += value;

        // Agrégation globale
        if (!timeSeries.global[formattedDate]) {
          timeSeries.global[formattedDate] = 0;
        }
        timeSeries.global[formattedDate] += value;

        // Total par date pour statistiques rapides
        if (!timeSeries.totalsByDate[formattedDate]) {
          timeSeries.totalsByDate[formattedDate] = 0;
        }
        timeSeries.totalsByDate[formattedDate] += value;
      });

      // Ajouter la région au pays
      const regionKey = province || 'main';
      timeSeries.countries[country].provinces[regionKey] = regionData;
    });

    return timeSeries;
  }

  /**
   * Formate une date du format M/D/YY au format YYYY-MM-DD
   * @param {string} dateStr - Date au format M/D/YY
   * @returns {string} - Date formatée YYYY-MM-DD
   */
  formatDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;

    let [month, day, year] = parts;
    
    // Convertir l'année YY en YYYY
    year = parseInt(year);
    if (year < 50) {
      year += 2000;
    } else if (year < 100) {
      year += 1900;
    }

    // Ajouter des zéros si nécessaire
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Calcule les cas actifs estimés (confirmed - deaths)
   * @param {Object} confirmedData - Données des cas confirmés
   * @param {Object} deathsData - Données des décès
   * @returns {Object} - Données des cas actifs estimés
   */
  calculateActiveCases(confirmedData, deathsData) {
    const activeData = {
      dataType: 'active',
      lastUpdated: new Date().toISOString(),
      countries: {},
      global: {},
      totalsByDate: {}
    };

    // Calculer pour chaque pays
    Object.keys(confirmedData.countries).forEach(countryName => {
      const confirmedCountry = confirmedData.countries[countryName];
      const deathsCountry = deathsData.countries[countryName];

      if (confirmedCountry && deathsCountry) {
        activeData.countries[countryName] = {
          name: countryName,
          provinces: {},
          total: {},
          coordinates: confirmedCountry.coordinates
        };

        // Calculer les totaux par date
        Object.keys(confirmedCountry.total).forEach(date => {
          const confirmed = confirmedCountry.total[date] || 0;
          const deaths = deathsCountry.total[date] || 0;
          const active = Math.max(0, confirmed - deaths); // S'assurer que ce n'est pas négatif

          activeData.countries[countryName].total[date] = active;

          // Agrégation globale
          if (!activeData.global[date]) {
            activeData.global[date] = 0;
          }
          activeData.global[date] += active;

          if (!activeData.totalsByDate[date]) {
            activeData.totalsByDate[date] = 0;
          }
          activeData.totalsByDate[date] += active;
        });
      }
    });

    return activeData;
  }

  /**
   * Récupère toutes les données COVID-19 disponibles
   * @returns {Promise<Object>} - Toutes les données transformées
   */
  async getAllData() {
    // Vérifier le cache
    const cacheKey = 'all_data';
    if (this.cache.has(cacheKey) && this.lastFetch && 
        (Date.now() - this.lastFetch < this.cacheTimeout)) {
      console.log('Utilisation des données en cache');
      return this.cache.get(cacheKey);
    }

    console.log('Récupération des nouvelles données...');

    try {
      // Récupérer seulement les données disponibles (confirmed et deaths)
      const [confirmedCSV, deathsCSV] = await Promise.all([
        this.fetchCSV(COVID_DATA_URLS.confirmed),
        this.fetchCSV(COVID_DATA_URLS.deaths)
      ]);

      // Parser les CSV
      const confirmedData = this.parseCSV(confirmedCSV);
      const deathsData = this.parseCSV(deathsCSV);

      // Transformer en séries temporelles
      const confirmed = this.transformToTimeSeries(confirmedData, 'confirmed');
      const deaths = this.transformToTimeSeries(deathsData, 'deaths');
      
      // Calculer les cas actifs estimés
      const active = this.calculateActiveCases(confirmed, deaths);

      const result = {
        confirmed,
        deaths,
        active, // Remplace "recovered" par "active"
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'Johns Hopkins University CSSE',
          dataTypes: ['confirmed', 'deaths', 'active'],
          notes: {
            recovered: 'Les données de guérisons ont été arrêtées le 5 août 2021',
            active: 'Cas actifs estimés = Cas confirmés - Décès',
            dataEnd: 'Collecte de données arrêtée le 10 mars 2023'
          }
        }
      };

      // Mettre en cache
      this.cache.set(cacheKey, result);
      this.lastFetch = Date.now();

      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  /**
   * Récupère les données pour un pays spécifique
   * @param {string} countryName - Nom du pays
   * @returns {Promise<Object>} - Données du pays
   */
  async getCountryData(countryName) {
    const allData = await this.getAllData();
    const result = {};

    Object.keys(allData).forEach(dataType => {
      if (dataType !== 'metadata') {
        const countryData = allData[dataType].countries[countryName];
        if (countryData) {
          result[dataType] = countryData;
        }
      }
    });

    return result;
  }

  /**
   * Récupère les données globales agrégées
   * @returns {Promise<Object>} - Données globales
   */
  async getGlobalData() {
    const allData = await this.getAllData();
    const result = {};

    Object.keys(allData).forEach(dataType => {
      if (dataType !== 'metadata') {
        result[dataType] = allData[dataType].global;
      }
    });

    result.metadata = allData.metadata;
    return result;
  }

  /**
   * Obtient la liste de tous les pays disponibles
   * @returns {Promise<Array>} - Liste des pays
   */
  async getAvailableCountries() {
    const allData = await this.getAllData();
    return Object.keys(allData.confirmed.countries);
  }

  /**
   * Calcule des statistiques rapides
   * @returns {Promise<Object>} - Statistiques globales
   */
  async getGlobalStats() {
    const allData = await this.getAllData();
    
    // Obtenir la dernière date disponible
    const dates = Object.keys(allData.confirmed.global).sort();
    const lastDate = dates[dates.length - 1];
    const prevDate = dates[dates.length - 2];

    const stats = {
      lastUpdate: lastDate,
      current: {
        confirmed: allData.confirmed.global[lastDate] || 0,
        deaths: allData.deaths.global[lastDate] || 0,
        active: allData.active.global[lastDate] || 0
      },
      daily: {
        confirmed: (allData.confirmed.global[lastDate] || 0) - (allData.confirmed.global[prevDate] || 0),
        deaths: (allData.deaths.global[lastDate] || 0) - (allData.deaths.global[prevDate] || 0),
        active: (allData.active.global[lastDate] || 0) - (allData.active.global[prevDate] || 0)
      }
    };
    
    return stats;
  }

  /**
   * Vérifie si les données sont encore à jour (dernière mise à jour < 6 mois)
   * @returns {Promise<Object>} - Information sur la fraîcheur des données
   */
  async getDataFreshness() {
    const allData = await this.getAllData();
    const dates = Object.keys(allData.confirmed.global).sort();
    const lastDataDate = new Date(dates[dates.length - 1]);
    const now = new Date();
    const daysSinceLastUpdate = Math.floor((now - lastDataDate) / (1000 * 60 * 60 * 24));
    
    return {
      lastDataDate: lastDataDate.toISOString(),
      daysSinceLastUpdate,
      isStale: daysSinceLastUpdate > 180,
      warning: daysSinceLastUpdate > 180 ? 
        'Attention: Ces données ne sont plus mises à jour depuis mars 2023' : null
    };
  }

  /**
   * Nettoie le cache
   */
  clearCache() {
    this.cache.clear();
    this.lastFetch = null;
  }
}

const covidData = new CovidData();

export default covidData;
export { CovidData };