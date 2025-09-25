'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCovidData } from '@/services/covidContext';

// Import dynamique pour éviter les erreurs SSR avec Leaflet sinon kaboum
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface CountryData {
  country: string;
  lat: number;
  lng: number;
  confirmed: number;
  deaths: number;
  active: number;
  population?: number;
  flag?: string;
}

const countryFlags: { [key: string]: string } = {
  "US": "🇺🇸",
  "China": "🇨🇳", 
  "India": "🇮🇳",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Brazil": "🇧🇷",
  "Japan": "🇯🇵",
  "Korea, South": "🇰🇷",
  "Italy": "🇮🇹",
  "Russia": "🇷🇺",
  "United Kingdom": "🇬🇧",
  "Spain": "🇪🇸",
  "Canada": "🇨🇦",
  "Australia": "�🇺"
};

interface WorldMapProps {
  data?: CountryData[];
}

const WorldMap: React.FC<WorldMapProps> = ({ data: externalData }) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  
  // Utiliser le contexte COVID
  const { 
    allData,
    availableCountries,
    loading, 
    error, 
    loadAllData,
    getTopCountries,
    selectedDataType
  } = useCovidData();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fonction pour transformer les données du contexte en format pour la carte
  const transformCovidDataToMapData = (): CountryData[] => {
    if (!allData || !allData.confirmed) return [];

    const countries = Object.keys(allData.confirmed.countries);
    
    const mappedCountries: CountryData[] = [];
    
    countries.forEach((countryName: string) => {
      const confirmedData = allData.confirmed.countries[countryName];
      const deathsData = allData.deaths?.countries[countryName];
      const activeData = allData.active?.countries[countryName];
      
      if (!confirmedData) return;
      
      // Obtenir les dernières valeurs
      const confirmedDates = Object.keys(confirmedData.total).sort();
      const lastDate = confirmedDates[confirmedDates.length - 1];
      
      const confirmed = confirmedData.total[lastDate] || 0;
      const deaths = deathsData?.total[lastDate] || 0;
      const active = activeData?.total[lastDate] || 0;
      
      if (confirmed > 0 || deaths > 0) {
        mappedCountries.push({
          country: countryName,
          lat: confirmedData.coordinates?.lat || 0,
          lng: confirmedData.coordinates?.long || 0,
          confirmed,
          deaths,
          active,
          flag: countryFlags[countryName] || "🌍"
        });
      }
    });
    
    return mappedCountries
      .sort((a: CountryData, b: CountryData) => b.confirmed - a.confirmed)
      .slice(0, 50);
  };

  const data = externalData || transformCovidDataToMapData();

  // Fonction pour calculer la taille du marqueur basée sur le nombre de cas
  const getMarkerSize = (confirmed: number): number => {
    const maxCases = Math.max(...data.map(d => d.confirmed));
    const minSize = 10;
    const maxSize = 50;
    return minSize + (confirmed / maxCases) * (maxSize - minSize);
  };

  // Fonction pour obtenir la couleur basée sur le taux de mortalité
  const getMarkerColor = (deaths: number, confirmed: number): string => {
    const mortalityRate = (deaths / confirmed) * 100;
    if (mortalityRate > 3) return '#dc2626'; // Rouge vif
    if (mortalityRate > 2) return '#f59e0b'; // Jaune/Orange
    if (mortalityRate > 1) return '#eab308'; // Jaune
    return '#16a34a'; // Vert
  };

  // Formater les nombres
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Gestion des états de chargement et d'erreur
  if (!isClient || loading) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-full h-full bg-gray-800" />
          {loading && (
            <p className="text-gray-400 text-sm">
              Chargement des données COVID-19...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center border border-red-700">
        <div className="text-center space-y-4 p-6">
          <div className="text-red-400 text-2xl">⚠️</div>
          <h3 className="text-red-400 font-semibold">Erreur de chargement</h3>
          <p className="text-gray-400 text-sm max-w-md">
            {error}
          </p>
          <button 
            onClick={loadAllData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
        <div className="text-center space-y-4 p-6">
          <div className="text-gray-400 text-2xl">📊</div>
          <h3 className="text-gray-300 font-semibold">Aucune donnée disponible</h3>
          <p className="text-gray-400 text-sm">
            Les données COVID-19 ne sont pas encore chargées ou sont indisponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Carte */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Carte Mondiale COVID-19</CardTitle>
              <CardDescription className="text-gray-400">
                Cliquez sur les marqueurs pour voir les détails par pays. 
                La taille indique le nombre de cas, la couleur le taux de mortalité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg overflow-hidden bg-gray-800">
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  maxBounds={[[-90, -180], [90, 180]]}
                  maxBoundsViscosity={1.0}
                  className="dark-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  />
                  {data.map((country, index) => (
                    <CircleMarker
                      key={`${country.country}-${index}`}
                      center={[country.lat, country.lng]}
                      radius={getMarkerSize(country.confirmed)}
                      pathOptions={{
                        color: getMarkerColor(country.deaths, country.confirmed),
                        fillColor: getMarkerColor(country.deaths, country.confirmed),
                        fillOpacity: 0.6,
                        weight: 2
                      }}
                      eventHandlers={{
                        click: () => setSelectedCountry(country),
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-48 bg-gray-800 text-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{country.flag}</span>
                            <h3 className="font-bold text-lg text-gray-100">{country.country}</h3>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Cas confirmés:</span>
                              <span className="font-semibold text-blue-400">
                                {formatNumber(country.confirmed)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Décès:</span>
                              <span className="font-semibold text-red-400">
                                {formatNumber(country.deaths)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Cas actifs:</span>
                              <span className="font-semibold text-green-400">
                                {formatNumber(country.active)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Taux de mortalité:</span>
                              <span className="font-semibold text-yellow-400">
                                {((country.deaths / country.confirmed) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau d'informations */}
        <div className="space-y-4">
          {/* Légende */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100">Légende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium mb-2 text-gray-200">Taille des marqueurs</h4>
                <p className="text-sm text-gray-400">
                  Plus le cercle est grand, plus le nombre de cas confirmés est élevé
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-200">Couleurs</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-gray-300">{'< 1%'} mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-300">1-2% mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
                    <span className="text-gray-300">2-3% mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-600"></div>
                    <span className="text-gray-300">{'> 3%'} mortalité</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails du pays sélectionné */}
          {selectedCountry && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  {selectedCountry.country}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Cas confirmés</p>
                    <p className="font-bold text-blue-400">
                      {formatNumber(selectedCountry.confirmed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Décès</p>
                    <p className="font-bold text-red-400">
                      {formatNumber(selectedCountry.deaths)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cas actifs</p>
                    <p className="font-bold text-yellow-400">
                      {formatNumber(selectedCountry.active)}
                    </p>
                  </div>
                </div>
                {selectedCountry.population && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">Population</p>
                    <p className="font-semibold text-gray-200">
                      {formatNumber(selectedCountry.population)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Taux d'infection: <span className="text-yellow-400">{((selectedCountry.confirmed / selectedCountry.population) * 100).toFixed(2)}%</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistiques globales */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100">Statistiques Globales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total cas:</span>
                  <span className="font-semibold text-blue-400">
                    {formatNumber(data.reduce((sum, country) => sum + country.confirmed, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total décès:</span>
                  <span className="font-semibold text-red-400">
                    {formatNumber(data.reduce((sum, country) => sum + country.deaths, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total cas actifs:</span>
                  <span className="font-semibold text-green-400">
                    {formatNumber(data.reduce((sum, country) => sum + country.active, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pays affichés:</span>
                  <span className="font-semibold text-gray-200">{data.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
