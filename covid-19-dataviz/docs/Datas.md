# Documentation des Services de Données COVID-19

Cette documentation explique l'architecture et le fonctionnement des services de gestion des données COVID-19 dans l'application.

## Architecture générale

```
API GitHub → covidData.js → covidContext.js → Components React
```

L'application utilise une architecture en couches qui sépare clairement :
- **La récupération des données** (service `covidData.js`)
- **La gestion d'état** (contexte `covidContext.js`) 
- **L'affichage** (composants React)

---

## 1. `covidData.js` - Service de récupération des données

Ce fichier est un **service de données** qui s'occupe de récupérer et traiter les données COVID-19 depuis les sources officielles.

### 🔗 **Sources de données**
```javascript
const COVID_DATA_URLS = {
  confirmed: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
  deaths: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
  recovered: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'
};
```

- **Source** : Johns Hopkins University CSSE
- **Format** : Fichiers CSV mis à jour quotidiennement
- **Types de données** : Cas confirmés, décès, guérisons

### 📊 **Traitement des données**

#### Méthodes principales de traitement :

| Méthode | Description |
|---------|-------------|
| `fetchCSV(url)` | Télécharge les fichiers CSV depuis GitHub |
| `parseCSV(csvText)` | Convertit le CSV en objets JavaScript |
| `parseCSVLine(line)` | Parse une ligne CSV en gérant guillemets et virgules |
| `transformToTimeSeries(rawData, dataType)` | Transforme les données brutes en séries temporelles |
| `formatDate(dateStr)` | Standardise le format des dates (M/D/YY → YYYY-MM-DD) |

#### Structure des données transformées :
```javascript
{
  dataType: 'confirmed',
  lastUpdated: '2025-09-19T10:30:00.000Z',
  countries: {
    'France': {
      name: 'France',
      provinces: {...},
      total: { '2025-09-19': 12345, ... },
      coordinates: { lat: 46.603, long: 1.888 }
    }
  },
  global: { '2025-09-19': 567890123, ... },
  totalsByDate: { '2025-09-19': 567890123, ... }
}
```

### 💾 **Système de cache**

- **Durée** : 1 heure (3600000 ms)
- **Stockage** : Map JavaScript en mémoire
- **Avantages** : 
  - Évite les requêtes répétées
  - Améliore les performances
  - Réduit la charge sur l'API source

```javascript
// Vérification du cache
if (this.cache.has(cacheKey) && this.lastFetch && 
    (Date.now() - this.lastFetch < this.cacheTimeout)) {
  return this.cache.get(cacheKey);
}
```

### 🌍 **API publique**

| Méthode | Retour | Description |
|---------|--------|-------------|
| `getAllData()` | `Promise<Object>` | Récupère toutes les données (confirmés, décès, guérisons) |
| `getCountryData(countryName)` | `Promise<Object>` | Données spécifiques à un pays |
| `getGlobalData()` | `Promise<Object>` | Données mondiales agrégées |
| `getAvailableCountries()` | `Promise<Array>` | Liste tous les pays disponibles |
| `getGlobalStats()` | `Promise<Object>` | Statistiques rapides avec variations quotidiennes |
| `clearCache()` | `void` | Vide le cache pour forcer une actualisation |

#### Exemple d'utilisation :
```javascript
import covidData from '@/services/covidData';

// Récupérer toutes les données
const allData = await covidData.getAllData();

// Données pour la France
const franceData = await covidData.getCountryData('France');

// Statistiques globales
const stats = await covidData.getGlobalStats();
```

---

## 2. `covidContext.js` - Contexte React pour la gestion d'état

Ce fichier implémente un **Context React** avec un reducer pour gérer l'état global de l'application. C'est le "cerveau" qui coordonne toutes les données et interactions utilisateur.

### 🔄 **Gestion d'état avec useReducer**

#### Actions disponibles :
```javascript
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_SELECTED_COUNTRY: 'SET_SELECTED_COUNTRY',
  SET_SELECTED_DATA_TYPE: 'SET_SELECTED_DATA_TYPE',
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  CLEAR_ERROR: 'CLEAR_ERROR'
}
```

- **Pattern** : Redux-like avec actions typées
- **Avantages** : État prévisible, debuggage facile, undo/redo possible

### 📋 **État initial**

```javascript
const initialState = {
  // Données
  allData: null,              // Toutes les données COVID transformées
  globalStats: null,          // Statistiques globales calculées
  availableCountries: [],     // Liste des pays disponibles
  
  // État de l'interface
  loading: false,             // Indicateur de chargement
  error: null,               // Messages d'erreur
  
  // Filtres et sélections utilisateur
  selectedCountry: null,      // Pays sélectionné par l'utilisateur
  selectedDataType: 'confirmed', // Type : confirmed/deaths/recovered
  dateRange: {               // Plage de dates pour filtrage
    start: null,
    end: null
  },
  
  // Métadonnées
  lastUpdated: null          // Timestamp de dernière mise à jour
}
```

### 🎯 **Actions disponibles**

#### Actions de données :
| Action | Description | Utilisation |
|--------|-------------|-------------|
| `loadAllData()` | Charge toutes les données via covidData.js | Initialisation de l'app |
| `refreshData()` | Actualise les données (vide le cache) | Bouton "Actualiser" |

#### Actions de sélection :
| Action | Paramètres | Description |
|--------|------------|-------------|
| `selectCountry(countryName)` | `string \| null` | Sélectionne un pays ou revient au global |
| `selectDataType(dataType)` | `'confirmed' \| 'deaths' \| 'recovered'` | Change le type de données affiché |
| `setDateRange(start, end)` | `string, string` | Définit une plage de dates |

#### Actions utilitaires :
| Action | Description |
|--------|-------------|
| `clearError()` | Efface les messages d'erreur |

### 🔍 **Selectors (fonctions de calcul)**

#### Sélecteurs de données :
```javascript
// Données du pays actuellement sélectionné
getSelectedCountryData() // → Object | null

// Données globales pour le type sélectionné
getGlobalDataByType() // → Object

// Données filtrées par période
getDataInDateRange(data) // → Object
```

#### Sélecteurs d'analyse :
```javascript
// Top N des pays par nombre de cas
getTopCountries(n = 10) // → Array<{name, value, data}>

// Calcule la tendance sur 7 jours
getTrend(data) // → number (-1 à 1)
```

#### Exemple de calcul de tendance :
```javascript
getTrend(data) {
  const dates = Object.keys(data).sort();
  const recent = dates.slice(-7);    // 7 derniers jours
  const older = dates.slice(-14, -7); // 7 jours précédents
  
  const recentAvg = recent.reduce(...) / recent.length;
  const olderAvg = older.reduce(...) / older.length;
  
  return (recentAvg - olderAvg) / olderAvg; // Pourcentage de variation
}
```

### 🎣 **Hooks exportés**

#### Hook principal :
```javascript
const {
  // État
  allData, loading, error, selectedCountry, selectedDataType,
  
  // Actions
  loadAllData, refreshData, selectCountry, selectDataType,
  
  // Selectors
  getSelectedCountryData, getTopCountries, getTrend,
  
  // Utilitaires
  isDataLoaded, hasError, isEmpty
} = useCovidData();
```

#### Hook spécialisé pour les statistiques :
```javascript
const stats = useCovidStats(); 
// Retourne les stats globales ou du pays sélectionné
// Format : { current: {confirmed, deaths, recovered}, daily: {...} }
```

### 💡 **Utilisation dans les composants**

```javascript
import { useCovidData, useCovidStats } from '@/services/covidContext';

function MyComponent() {
  const { 
    selectedCountry, 
    selectCountry, 
    availableCountries,
    loading 
  } = useCovidData();
  
  const stats = useCovidStats();

  return (
    <div>
      {loading && <div>Chargement...</div>}
      
      <select 
        value={selectedCountry || ''} 
        onChange={(e) => selectCountry(e.target.value || null)}
      >
        <option value="">Monde</option>
        {availableCountries.map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>
      
      <div>Cas confirmés : {stats.current.confirmed}</div>
    </div>
  );
}
```

---

## 🚀 **Cycle de vie des données**

### 1. **Initialisation**
```
App Start → CovidProvider → useEffect → loadAllData() → covidData.getAllData()
```

### 2. **Récupération**
```
fetchCSV(3 URLs) → parseCSV() → transformToTimeSeries() → Cache → State
```

### 3. **Utilisation**
```
Component → useCovidData() → Selectors → Rendered Data
```

### 4. **Actualisation**
```
User Click → refreshData() → clearCache() → loadAllData() → Fresh Data
```

---

## 🔧 **Configuration et personnalisation**

### Cache
```javascript
// Dans covidData.js
this.cacheTimeout = 1000 * 60 * 60; // 1 heure

// Pour changer la durée :
covidData.cacheTimeout = 1000 * 60 * 30; // 30 minutes
```

### Sources de données
```javascript
// Pour changer les URLs source
const COVID_DATA_URLS = {
  confirmed: 'votre-url-personnalisée.csv',
  // ...
};
```

### Types de données
```javascript
// Pour ajouter un nouveau type
const ACTIONS = {
  // ... existing actions
  SET_SELECTED_HOSPITALIZED: 'SET_SELECTED_HOSPITALIZED'
};

// Dans le reducer
case ACTIONS.SET_SELECTED_HOSPITALIZED:
  return { ...state, selectedDataType: 'hospitalized' };
```

---

## 🐛 **Gestion d'erreurs**

### Types d'erreurs gérées :
- **Erreurs réseau** : Problème de connexion ou serveur indisponible
- **Erreurs de parsing** : Format CSV invalide ou corrompu  
- **Erreurs de données** : Données manquantes ou incohérentes

### Stratégies de récupération :
```javascript
// Dans covidContext.js
try {
  const allData = await covidData.getAllData();
  // Succès
} catch (error) {
  dispatch({ 
    type: ACTIONS.SET_ERROR, 
    payload: `Erreur : ${error.message}` 
  });
  // L'utilisateur voit le message d'erreur
  // Les données en cache restent utilisables
}
```

---

## 📊 **Performance**

### Optimisations implémentées :
- **Cache intelligent** : Évite les requêtes répétées
- **Chargement parallèle** : Les 3 types de données se chargent simultanément
- **Transformation une seule fois** : Les données sont transformées au chargement
- **Selectors mémorisés** : Calculs optimisés côté contexte

### Métriques typiques :
- **Premier chargement** : 2-5 secondes (selon connexion)
- **Chargements suivants** : < 100ms (cache)
- **Taille des données** : ~2-5 MB par type
- **Mémoire utilisée** : ~15-30 MB total

---

## 🔒 **Sécurité**

### Mesures de sécurité :
- **HTTPS obligatoire** : Toutes les requêtes vers GitHub
- **Validation des données** : Vérification du format CSV
- **Sanitisation** : Nettoyage des valeurs avant affichage
- **Pas de stockage persistant** : Données sensibles en mémoire uniquement

---

## 🧪 **Tests recommandés**

### Tests unitaires à implémenter :
```javascript
// covidData.js
describe('CovidData', () => {
  test('parseCSV should handle quotes correctly', () => {});
  test('formatDate should convert MM/DD/YY to YYYY-MM-DD', () => {});
  test('cache should expire after timeout', () => {});
});

// covidContext.js  
describe('CovidContext', () => {
  test('should load data on mount', () => {});
  test('selectCountry should update selectedCountry', () => {});
  test('getTopCountries should return sorted array', () => {});
});
```

### Tests d'intégration :
- Chargement complet des données réelles
- Navigation entre pays et types de données
- Gestion des erreurs réseau simulées