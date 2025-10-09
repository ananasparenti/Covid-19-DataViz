# Documentation des Services de Données COVID-19

Cette documentation explique l'architecture et le fonctionnement des services de gestion des données COVID-19 dans l'application.

## Architecture générale

```
GitHub CSV → covidData.js → services/covidContext.js → Components React
```

L'application utilise une architecture en couches qui sépare clairement :
- **La récupération des données** (service `covidData.js`)
- **La gestion d'état** (contexte `services/covidContext.js`) 
- **L'affichage** (composants React)

---

## 1. `covidData.js` - Service de récupération des données

Ce fichier est un **service de données** qui s'occupe de récupérer et traiter les données COVID-19 directement depuis les fichiers CSV du repository GitHub de Johns Hopkins University.

### 🔗 **Sources de données**
```javascript
const COVID_DATA_URLS = {
  confirmed: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
  deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'
  // Note: recovered data discontinued since August 5, 2021
};
```

- **Source** : Johns Hopkins University CSSE (fichiers CSV bruts)
- **Format** : Fichiers CSV téléchargés directement depuis GitHub
- **Types de données** : Cas confirmés, décès, cas actifs (calculés)
- **Avantages** : Données officielles directes, pas d'intermédiaire, contrôle total du traitement

### 📊 **Traitement des données CSV**

#### Méthodes principales de traitement :

| Méthode | Description |
|---------|-------------|
| `fetchCSV(url)` | Télécharge les fichiers CSV depuis GitHub |
| `parseCSV(csvText)` | Convertit le CSV en objets JavaScript |
| `parseCSVLine(line)` | Parse une ligne CSV en gérant guillemets et virgules |
| `transformToTimeSeries(rawData, dataType)` | Transforme les données brutes en séries temporelles |
| `formatDate(dateStr)` | Standardise le format des dates (M/D/YY → YYYY-MM-DD) |
| `calculateActiveCases(confirmedData, deathsData)` | Calcule les cas actifs estimés |

#### Structure des données transformées :
```javascript
{
  dataType: 'confirmed',
  lastUpdated: '2025-09-25T10:30:00.000Z',
  countries: {
    'France': {
      name: 'France',
      provinces: {
        'main': {
          name: 'France',
          coordinates: { lat: 46.603, long: 1.888 },
          data: { '2025-09-25': 12345, ... }
        }
      },
      total: { '2025-09-25': 12345, ... },
      coordinates: { lat: 46.603, long: 1.888 }
    }
  },
  global: { '2025-09-25': 567890123, ... },
  totalsByDate: { '2025-09-25': 567890123, ... }
}
```

### � **Gestion des erreurs et fiabilité**

- **Durée** : 1 heure (3600000 ms)
- **Stockage** : Map JavaScript en mémoire
- **Avantages** : 
  - Évite les requêtes répétées vers GitHub
  - Améliore les performances
  - Réduit la charge sur l'infrastructure GitHub
  - Gestion automatique de l'expiration

```javascript
// Vérification du cache
async getAllData() {
  const cacheKey = 'all_data';
  if (this.cache.has(cacheKey) && this.lastFetch && 
      (Date.now() - this.lastFetch < this.cacheTimeout)) {
    console.log('Utilisation des données en cache');
    return this.cache.get(cacheKey);
  }
  
  console.log('Récupération des nouvelles données...');
  // Fetch depuis GitHub et mise en cache...
}
```

### 🌍 **API publique du service CSV**

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getAllData()` | `Promise<Object>` | Toutes les données transformées depuis CSV |
| `getCountriesData()` | `Promise<Array>` | Liste des pays avec leurs données |
| `getGlobalData()` | `Promise<Object>` | Statistiques globales calculées |
| `getTimeSeriesData()` | `Promise<Object>` | Séries temporelles par type de données |
| `parseCSV(csvText)` | `Array` | Parse un fichier CSV brut |
| `transformToCountryData(parsed)` | `Array` | Transforme CSV parsé en format pays |
| `calculateGlobalStats(countries)` | `Object` | Calcule les stats globales depuis pays |
| `processTimeSeriesData(parsed)` | `Object` | Traite les données temporelles |

#### Exemple d'utilisation :
```javascript
import covidDataService from '@/lib/covidData';

// Récupérer toutes les données depuis GitHub CSV
const allData = await covidDataService.getAllData();

// Données des pays uniquement
const countries = await covidDataService.getCountriesData();

// Statistiques globales calculées
const globalStats = await covidDataService.getGlobalData();

// Séries temporelles
const timeSeries = await covidDataService.getTimeSeriesData();
```

---

## 2. `services/covidContext.js` - Contexte React pour la gestion d'état

Ce fichier implémente un **Context React** avec un reducer pour gérer l'état global de l'application. Il utilise le service `covidData.js` pour récupérer les données CSV et les mettre à disposition des composants.

### 🔄 **Gestion d'état avec useReducer**

#### Actions disponibles :
```javascript
const actionTypes = {
  LOADING: 'LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_SELECTED_COUNTRY: 'SET_SELECTED_COUNTRY',
  SET_TIME_RANGE: 'SET_TIME_RANGE',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY'
}
```

- **Pattern** : Redux-like avec actions typées pour gérer les données CSV
- **Avantages** : État centralisé, cache automatique, gestion d'erreurs

### 📋 **État initial**

```javascript
const initialState = {
  // Données depuis CSV GitHub
  allData: null,             // Toutes les données transformées
  countries: [],             // Données des pays
  global: null,              // Statistiques globales calculées
  timeSeries: null,          // Séries temporelles
  
  // État de l'interface
  loading: false,            // Indicateur de chargement CSV
  error: null,              // Messages d'erreur de traitement
  
  // Filtres utilisateur
  selectedCountry: null,     // Pays sélectionné
  searchQuery: '',          // Recherche de pays
  timeRange: 30,            // Période d'analyse
  
  // Métadonnées
  lastUpdate: null,         // Timestamp du cache
  filteredCountries: []     // Résultats de recherche
}
```

### 🎯 **Actions disponibles**

#### Actions principales :
| Action | Description | Service utilisé |
|--------|-------------|----------------|
| `loadData()` | Charge toutes les données depuis GitHub CSV | `covidDataService.getAllData()` |

#### Actions de sélection et filtrage :
| Action | Paramètres | Description |
|--------|------------|-------------|
| `selectCountry(countryName)` | `string \| null` | Sélectionne un pays ou revient au global |
| `setTimeRange(days)` | `number` | Définit la période pour l'analyse |
| `setSearchQuery(query)` | `string` | Filtre les pays par nom |

### 🔍 **Hook personnalisé (useCovid)**

#### Accès aux données :
```javascript
// Dans un composant React
const { 
  data, 
  loading, 
  error, 
  selectedCountry, 
  searchQuery 
} = useCovid();

// Données disponibles
const countries = data?.countries || [];
const globalStats = data?.global || null;
const timeSeries = data?.timeSeries || null;
```

#### Actions disponibles :
```javascript
import { useCovidActions } from '@/services/covidContext';

const { 
  setSelectedCountry, 
  setSearchQuery, 
  setTimeRange 
} = useCovidActions();

// Sélectionner un pays
setSelectedCountry('France');

// Filtrer par recherche
setSearchQuery('United');
```

#### Exemple d'utilisation complète :
```javascript
import { useCovid, useCovidActions } from '@/services/covidContext';

function CountryDashboard() {
  const { data, loading, error, selectedCountry } = useCovid();
  const { setSelectedCountry, setSearchQuery } = useCovidActions();
  
  if (loading) return <div>Chargement des données CSV...</div>;
  if (error) return <div>Erreur: {error}</div>;
  
  return (
    <div>
      <h2>Données COVID-19 depuis GitHub CSV</h2>
      <p>Pays sélectionné: {selectedCountry || 'Global'}</p>
      <p>Nombre de pays: {data?.countries?.length || 0}</p>
    </div>
  );
}
```

### 🎣 **Hooks exportés**

#### Hook principal :
```javascript
const {
  // État des données depuis CSV GitHub
  data, loading, error,
  
  // Sélections utilisateur
  selectedCountry, searchQuery, timeRange,
  
  // Actions
  loadData, setSelectedCountry, setSearchQuery, setTimeRange,
} = useCovid();
```

#### Utilisation du hook dans WorldMap :
```javascript
import { useCovid } from '@/services/covidContext';

function WorldMap() {
  const { 
    data,             // Toutes les données (countries, global, timeSeries)
    loading,          // État de chargement CSV
    error,            // Erreurs de traitement
    setSelectedCountry // Fonction pour sélectionner un pays
  } = useCovid();
  
  // Transformation pour la carte
  const mapData = data?.countries ? transformCovidDataToMapData(data.countries) : [];

  return (
    <div>
      {loading && <div>Chargement...</div>}
      <div>Cas globaux : {global?.confirmed}</div>
      {/* ... */}
    </div>
  );
}
```

---

## 🏗️ **Architecture finale - GitHub CSV**

```
📁 Projet COVID-19 DataViz
├── 📄 lib/covidData.js         → Service de traitement CSV
├── 📄 services/covidContext.js → Context React + Hook
└── 📄 components/WorldMap.tsx  → Composant de visualisation

🔄 Flux de données :
1. GitHub CSV Files → covidData.js (parsing + transformation)
2. covidData.js → services/covidContext.js (cache + état)
3. services/covidContext.js → Components (via useCovid hook)
```

### 📊 **Avantages de l'architecture CSV**

- ✅ **Données historiques complètes** depuis janvier 2020
- ✅ **Source fiable** : Johns Hopkins University
- ✅ **Pas de limites de taux** (rate limiting)
- ✅ **Cache intelligent** : réduction des requêtes réseau
- ✅ **Format prévisible** : structure CSV stable
- ✅ **Performance** : traitement côté client optimisé

### 💡 **Utilisation simplifiée dans les composants**

```javascript
import { useCovid } from '@/services/covidContext';

function Dashboard() {
  const { data, loading, error } = useCovid();
  
  if (loading) return <div>Chargement CSV...</div>;
  if (error) return <div>Erreur: {error}</div>;
  
  return (
    <div>
      <h2>Données COVID-19</h2>
      <p>Pays disponibles: {data?.countries.length}</p>
      <p>Dernière mise à jour: {data?.lastUpdate}</p>
    </div>
  );
}
      >
        <option value="">Monde</option>
        {filteredCountries.map(country => (
          <option key={country.country} value={country.country}>
            {country.country}
          </option>
        ))}
      </select>
      
      {/* Affichage des données */}
      <div>
        <h3>Statistiques {selectedCountry || 'Mondiales'}</h3>
        <p>Cas confirmés : {global?.confirmed}</p>
        <p>Décès : {global?.deaths}</p>
        <p>Guérisons : {global?.recovered}</p>
      </div>
    </div>
  );
}
```

---

## 🚀 **Cycle de vie des données**

### 1. **Initialisation**
```
App Start → CovidProvider → useEffect → loadData() → fetchCovidData()
```

### 2. **Récupération**
```
Disease.sh API → fetchGlobalStats() + fetchCountriesData() + fetchHistoricalData() → JSON → State
```

### 3. **Utilisation**
```
Component → useCovid() → State Data → Rendered Data
```

### 4. **Filtrage et recherche**
```
User Input → setSearchQuery() / setContinentFilter() → Reducer → filteredCountries → UI Update
```

### 5. **Sélection de pays**
```
User Click → selectCountry() → Reducer → selectedCountry → UI Update
```

---

## 🔧 **Configuration et personnalisation**

### API Endpoints
```javascript
// Dans covidAPI.js
const BASE_URL = 'https://disease.sh/v3/covid-19';

// Pour changer l'API de base :
const BASE_URL = 'https://votre-api-personnalisee.com/v1';
```

### Période par défaut
```javascript
// Dans covid-context.js
const initialState = {
  timeRange: 30, // Changer pour modifier la période par défaut
  // ...
};
```

### Critères de tri
```javascript
// Pour ajouter un nouveau critère de tri
function getTopCountriesByCriteria(criteria = 'confirmed', limit = 10) {
  return getTopCountries(state.countries, limit, criteria);
}

// Critères supportés : 'confirmed', 'deaths', 'recovered', 'active', 'critical'
```

### Filtres personnalisés
```javascript
// Pour ajouter un nouveau filtre
const actionTypes = {
  // ... existing actions
  SET_POPULATION_FILTER: 'SET_POPULATION_FILTER'
};

// Dans le reducer
case actionTypes.SET_POPULATION_FILTER:
  const filteredByPopulation = action.payload 
    ? state.countries.filter(country => country.population > action.payload)
    : state.countries;
  return { ...state, populationFilter: action.payload, filteredCountries: filteredByPopulation };
```

---

## 🐛 **Gestion d'erreurs**

### Types d'erreurs gérées :
- **Erreurs réseau** : Problème de connexion ou serveur indisponible
- **Erreurs de parsing** : Format CSV invalide ou corrompu  
- **Erreurs de données** : Données manquantes ou incohérentes

### Stratégies de récupération :
```javascript
// Dans covid-context.js
const loadData = async () => {
  dispatch({ type: actionTypes.LOADING });
  try {
    const data = await fetchCovidData();
    dispatch({ 
      type: actionTypes.FETCH_SUCCESS, 
      payload: data 
    });
  } catch (error) {
    dispatch({ 
      type: actionTypes.FETCH_ERROR, 
      payload: error.message 
    });
    // L'utilisateur voit le message d'erreur
    // L'interface reste utilisable avec les données précédentes
  }
};
```

---

## 📊 **Performance**

### Optimisations implémentées :
- **API optimisée** : Disease.sh est plus rapide que les CSV bruts
- **Données pré-agrégées** : Pas de calculs côté client
- **Filtrage côté client** : Recherche et filtres instantanés
- **État centralisé** : Une seule source de vérité pour toute l'app
- **Lazy loading** : Données historiques chargées à la demande

### Métriques typiques :
- **Premier chargement** : 1-3 secondes (selon connexion)
- **Filtrage/recherche** : < 50ms (côté client)
- **Taille des données** : ~500KB-2MB total
- **Mémoire utilisée** : ~5-15 MB total
- **Sélection de pays** : Instantané (déjà en mémoire)

---

## 🔒 **Sécurité**

### Mesures de sécurité :
- **HTTPS obligatoire** : Toutes les requêtes vers Disease.sh API
- **Validation des données** : Vérification du format JSON
- **Sanitisation** : Nettoyage des valeurs avant affichage
- **Pas de stockage persistant** : Données en mémoire uniquement
- **API publique** : Disease.sh est une API publique et fiable
- **Rate limiting** : Respect des limites de l'API

---

## 🧪 **Tests recommandés**

### Tests unitaires à implémenter :
```javascript
// covidAPI.js
describe('CovidAPI', () => {
  test('fetchGlobalStats should return correct format', () => {});
  test('fetchCountriesData should handle API errors', () => {});
  test('fetchHistoricalData should validate days parameter', () => {});
  test('searchCountries should filter correctly', () => {});
  test('calculateRates should compute mortality rate', () => {});
});

// covid-context.js  
describe('CovidContext', () => {
  test('should load data on mount', () => {});
  test('selectCountry should update selectedCountry', () => {});
  test('setSearchQuery should filter countries', () => {});
  test('setContinentFilter should filter by continent', () => {});
  test('getTopCountriesByCriteria should return sorted array', () => {});
});
```

### Tests d'intégration :
- Chargement complet des données depuis Disease.sh API
- Navigation entre pays et filtrage
- Recherche et sélection de pays
- Gestion des erreurs réseau simulées
- Test de la période historique (30, 60, 90 jours)
- Filtrage par continent