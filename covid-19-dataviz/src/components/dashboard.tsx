import React from 'react';
import { CovidProvider, useCovidData, useCovidStats } from '@/services/covidContext';
import { BarChart3 } from 'lucide-react';

interface CountryTimeSeriesData {
  total: Record<string, number>;
}

interface StatData {
  title: string;
  value: number;
  daily: number;
  color: string;
  icon: string;
  gradient: string;
}

interface CountryRanking {
  name: string;
  value: number;
}

interface TimeSeriesEntry {
  date: string;
  value: number;
}

const GlobalStats: React.FC = () => {
  const stats = useCovidStats();
  const { selectedCountry } = useCovidData();

  if (!stats) return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-700 rounded w-1/2"></div>
    </div>
  );

  const statsData: StatData[] = [
    {
      title: 'Cas Confirmés',
      value: stats.current?.confirmed || 0,
      daily: stats.daily?.confirmed || 0,
      color: 'blue',
      icon: '🦠',
      gradient: 'from-blue-500/20 to-blue-600/5'
    },
    {
      title: 'Décès',
      value: stats.current?.deaths || 0,
      daily: stats.daily?.deaths || 0,
      color: 'red',
      icon: '💀',
      gradient: 'from-red-500/20 to-red-600/5'
    },
    {
      title: 'Cas Actifs',
      value: stats.current?.active || 0,
      daily: stats.daily?.active || 0,
      color: 'green',
      icon: '⚡',
      gradient: 'from-green-500/20 to-green-600/5'
    }
  ];

  return (
    <div className="mb-8">
      {/* Header indicator */}
      {selectedCountry && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            📍 Statistiques pour: <span className="font-medium">{selectedCountry}</span>
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <div key={stat.title} className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} bg-gray-900 border border-gray-700 rounded-xl p-6 hover:scale-105 transition-all duration-300 group`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{stat.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">
                    {stat.title}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <p className={`text-3xl font-bold text-${stat.color}-400 group-hover:text-${stat.color}-300 transition-colors`}>
                    {stat.value.toLocaleString()}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${stat.color}-500/20 text-${stat.color}-300 border border-${stat.color}-500/30`}>
                      <span className="mr-1">+</span>
                      {stat.daily.toLocaleString()}
                    </div>
                    <span className="text-xs text-gray-400">aujourd'hui</span>
                  </div>
                </div>
              </div>
              
              <div className={`absolute top-4 right-4 w-16 h-16 bg-${stat.color}-500/10 rounded-full flex items-center justify-center group-hover:bg-${stat.color}-500/20 transition-colors`}>
                <div className={`w-8 h-8 bg-${stat.color}-500/20 rounded-full`}></div>
              </div>
            </div>
            
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-400`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour le sélecteur de pays
const CountrySelector: React.FC = () => {
  const { 
    availableCountries, 
    selectedCountry, 
    selectCountry, 
    loading 
  } = useCovidData();

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectCountry(e.target.value || null);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <span className="text-blue-400">🌍</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-100">Région</h3>
      </div>
      
      <div className="relative">
        <select
          id="country-select"
          value={selectedCountry || ''}
          onChange={handleCountryChange}
          disabled={loading}
          className="block w-full px-4 py-3 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none cursor-pointer hover:bg-gray-750"
        >
          <option value="">🌐 Données globales</option>
          {availableCountries.map((country: string) => (
            <option key={country} value={country}>
              🏳️ {country}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {selectedCountry && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            Affichage des données pour: <span className="font-medium">{selectedCountry}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Composant pour le sélecteur de type de données
const DataTypeSelector: React.FC = () => {
  const { selectedDataType, selectDataType } = useCovidData();

  interface DataType {
    value: string;
    label: string;
    color: string;
    icon: string;
    desc: string;
  }

  const dataTypes: DataType[] = [
    { value: 'confirmed', label: 'Cas Confirmés', color: 'blue', icon: '🦠', desc: 'Total des cas confirmés' },
    { value: 'deaths', label: 'Décès', color: 'red', icon: '💀', desc: 'Total des décès' },
    { value: 'active', label: 'Cas Actifs', color: 'green', icon: '⚡', desc: 'Cas confirmés - décès' }
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <span className="text-purple-400">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-100">Type de données</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {dataTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => selectDataType(type.value)}
            className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
              selectedDataType === type.value
                ? `bg-${type.color}-500/20 border-${type.color}-500 shadow-lg shadow-${type.color}-500/20`
                : `bg-gray-800 border-gray-600 hover:border-${type.color}-500/50 hover:bg-gray-750`
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                selectedDataType === type.value 
                  ? `bg-${type.color}-500/30` 
                  : `bg-${type.color}-500/10 group-hover:bg-${type.color}-500/20`
              }`}>
                <span className="text-lg">{type.icon}</span>
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium transition-colors ${
                  selectedDataType === type.value 
                    ? `text-${type.color}-300` 
                    : `text-gray-200 group-hover:text-${type.color}-400`
                }`}>
                  {type.label}
                </h4>
                <p className="text-sm text-gray-400">{type.desc}</p>
              </div>
              
              {selectedDataType === type.value && (
                <div className={`w-3 h-3 rounded-full bg-${type.color}-400 animate-pulse`}></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Composant pour la série temporelle
const TimeSeriesData: React.FC = () => {
  const { 
    getGlobalDataByType, 
    getSelectedCountryData, 
    selectedCountry,
    selectedDataType,
    getTrend
  } = useCovidData();

  let data: Record<string, number> = {};
  let title = 'Évolution Temporelle';
  let subtitle = 'Données Globales';

  if (selectedCountry) {
    const countryData = getSelectedCountryData();
    if (countryData && countryData[selectedDataType]) {
      data = countryData[selectedDataType].total;
      subtitle = selectedCountry;
    }
  } else {
    data = getGlobalDataByType();
    subtitle = 'Monde entier';
  }

  const trend = getTrend(data);
  const trendPercentage = (trend * 100).toFixed(1);

  // Obtenir les dernières valeurs
  const dates = Object.keys(data).sort();
  const latestValues: TimeSeriesEntry[] = dates.slice(-10).map(date => ({
    date,
    value: data[date]
  }));

  const getTrendColor = (trend: number): string => {
    if (trend > 5) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (trend > 0) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (trend < -5) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (trend < 0) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-100 mb-1">{title}</h3>
            <p className="text-gray-400">{subtitle} • {selectedDataType}</p>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getTrendColor(trend)}`}>
            <div className="flex items-center gap-1">
              <span className="text-xs">Tendance 7j:</span>
              <span className="font-bold">{trendPercentage}%</span>
            </div>
            <span className="text-lg">
              {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Cards Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {latestValues.slice(-5).map((item, index) => {
            const previousValue = index > 0 ? latestValues[latestValues.length - 5 + index - 1]?.value : item.value;
            const change = item.value - previousValue;
            const changePercent = previousValue > 0 ? ((change / previousValue) * 100).toFixed(1) : '0';

            return (
              <div key={item.date} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="text-xs text-gray-400 mb-2">
                  {new Date(item.date).toLocaleDateString('fr-FR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-bold text-gray-100 mb-1">
                  {item.value.toLocaleString()}
                </div>
                <div className={`text-xs flex items-center gap-1 ${
                  change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  <span>{change > 0 ? '↗' : change < 0 ? '↘' : '→'}</span>
                  <span>{Math.abs(Number(changePercent))}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
            <h4 className="text-sm font-medium text-gray-300">Détail des 10 derniers jours</h4>
          </div>
          
          <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {latestValues.reverse().map((item, index) => {
              const nextValue = index < latestValues.length - 1 ? latestValues[index + 1].value : item.value;
              const change = item.value - nextValue;
              const changePercent = nextValue > 0 ? ((change / nextValue) * 100).toFixed(1) : '0';

              return (
                <div key={item.date} className="px-4 py-3 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-100">
                        {item.value.toLocaleString()}
                      </span>
                      
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        change > 0 ? 'bg-red-500/20 text-red-400' : 
                        change < 0 ? 'bg-green-500/20 text-green-400' : 
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        <span>{change > 0 ? '+' : ''}{change.toLocaleString()}</span>
                        <span>({changePercent}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher le top des pays
const TopCountries: React.FC = () => {
  const { getTopCountries, selectedDataType } = useCovidData();
  const topCountries: CountryRanking[] = getTopCountries(10);

  if (topCountries.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🏆</div>
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  const getColorByType = (type: string): string => {
    switch(type) {
      case 'confirmed': return 'blue';
      case 'deaths': return 'red';
      case 'active': return 'green';
      default: return 'gray';
    }
  };

  const color = getColorByType(selectedDataType);
  const maxValue = topCountries[0]?.value || 1;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 bg-gradient-to-r from-${color}-500/20 to-${color}-600/5 border-b border-gray-700`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-${color}-500/20 rounded-lg flex items-center justify-center`}>
            <span className="text-lg">🏆</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">Classement Mondial</h3>
            <p className="text-sm text-gray-400">Top 10 des pays - {selectedDataType}</p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="p-6">
        <div className="space-y-3">
          {topCountries.map((country, index) => {
            const percentage = (country.value / maxValue) * 100;
            const isTop3 = index < 3;
            
            return (
              <div key={country.name} className={`relative group transition-all duration-300 ${
                isTop3 ? 'transform hover:scale-105' : ''
              }`}>
                {/* Background Bar */}
                <div className="absolute inset-0 bg-gray-800 rounded-lg">
                  <div 
                    className={`h-full bg-gradient-to-r from-${color}-500/30 to-${color}-500/10 rounded-lg transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                {/* Content */}
                <div className="relative px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? `bg-yellow-500/20 text-yellow-400 border border-yellow-500/30` :
                      index === 1 ? `bg-gray-300/20 text-gray-300 border border-gray-300/30` :
                      index === 2 ? `bg-orange-500/20 text-orange-400 border border-orange-500/30` :
                      `bg-gray-700 text-gray-400`
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    
                    {/* Country */}
                    <div>
                      <span className="font-medium text-gray-100 group-hover:text-white transition-colors">
                        {country.name}
                      </span>
                      {isTop3 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {percentage.toFixed(1)}% du total
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div className="text-right">
                    <span className={`font-bold text-lg text-${color}-400 group-hover:text-${color}-300 transition-colors`}>
                      {country.value.toLocaleString()}
                    </span>
                    {isTop3 && (
                      <div className="text-xs text-gray-400 mt-1">
                        cas
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Medal Effect for Top 3 */}
                {isTop3 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total affiché:</span>
            <span className={`font-medium text-${color}-400`}>
              {topCountries.reduce((sum, country) => sum + country.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour les contrôles d'actualisation
const DataControls: React.FC = () => {
  const { 
    refreshData, 
    loading, 
    lastUpdated, 
    clearError, 
    error 
  } = useCovidData();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-600/50 rounded-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-red-400 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="text-sm text-red-300 mb-2">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-400 hover:text-red-200 underline transition-colors"
              >
                Masquer ce message
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <span className="text-blue-400">⚡</span>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Centre de Contrôle</h3>
            {lastUpdated && (
              <p className="text-sm text-gray-400">
                Dernière mise à jour: {new Date(lastUpdated).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' : 
              error ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
            <span className="text-xs text-gray-400">
              {loading ? 'Synchronisation...' : error ? 'Erreur' : 'En ligne'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              loading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95'
            }`}
          >
            <span className={`transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}>
              🔄
            </span>
            <span>{loading ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal du dashboard
const CovidDashboardContent: React.FC = () => {
  const { loading, isDataLoaded, hasError } = useCovidData();

  if (loading && !isDataLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données COVID-19...</p>
        </div>
      </div>
    );
  }

  if (hasError && !isDataLoaded) {
    return (
      <div className="text-center p-8">
        <div className="text-red-400 text-xl mb-4">❌</div>
        <p className="text-gray-400">Impossible de charger les données</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Header */}
        <header className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-3xl">🦠</span>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                  COVID-19 DataViz
                </h1>
                <p className="text-gray-400 text-lg">
                  Tableau de bord en temps réel
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300">Données Johns Hopkins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Mise à jour quotidienne</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Données mondiales</span>
              </div>
            </div>
          </div>
        </header>

        {/* Statistics Overview */}
        <GlobalStats />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column - Top Countries */}
          <div className="xl:col-span-1">
            <TopCountries />
          </div>

          {/* Right Column - Controls and Data Visualization */}
          <div className="xl:col-span-3 space-y-6">
            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CountrySelector />
              <DataTypeSelector />
            </div>
            
            {/* Time Series Data */}
            <TimeSeriesData />
          </div>
        </div>

        {/* Controls at bottom */}
        <div className="mt-16">
          <DataControls />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 text-sm">
              © 2025 COVID-19 Analytics Dashboard • Données fournies par Johns Hopkins University CSSE
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
              <span>Développé avec React & Tailwind CSS</span>
              <span>•</span>
              <span>Design moderne et responsive</span>
              <span>•</span>
              <span>Données en temps réel</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Composant racine avec le Provider
const CovidDashboard: React.FC = () => {
  return (
    <CovidProvider>
      <CovidDashboardContent />
    </CovidProvider>
  );
};

export default CovidDashboard;

// Hook utilitaire pour l'exportation de données
export const useDataExport = () => {
  const { allData } = useCovidData();

  const exportToJSON = (filename: string = 'covid-data.json'): void => {
    if (!allData) return;
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (dataType: string = 'confirmed', filename: string = 'covid-data.csv'): void => {
    if (!allData || !allData[dataType]) return;

    const countries: Record<string, CountryTimeSeriesData> = allData[dataType].countries;
    const firstCountry = Object.values(countries)[0];
    const dates = Object.keys(firstCountry?.total || {}).sort();
    
    // Headers
    const headers = ['Country', ...dates];
    const rows = [headers.join(',')];
    
    // Data rows
    Object.keys(countries).forEach((countryName: string) => {
      const countryData: CountryTimeSeriesData = countries[countryName];
      const row = [countryName];
      
      dates.forEach((date: string) => {
        row.push(String(countryData.total[date] || 0));
      });
      
      rows.push(row.join(','));
    });
    
    const csvContent = rows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return {
    exportToJSON,
    exportToCSV,
    hasData: !!allData
  };
};