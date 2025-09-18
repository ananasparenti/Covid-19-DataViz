'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Import dynamique pour éviter les erreurs SSR avec Leaflet
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

// Interface pour les données de pays
interface CountryData {
  country: string;
  lat: number;
  lng: number;
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
  population?: number;
  flag?: string;
}

// Données d'exemple pour quelques pays (vous pouvez les étendre ou les récupérer via API)
const sampleCountriesData: CountryData[] = [
  {
    country: "United States",
    lat: 39.8283,
    lng: -98.5795,
    confirmed: 103436829,
    deaths: 1127152,
    recovered: 101309677,
    active: 1000000,
    population: 331002651,
    flag: "🇺🇸"
  },
  {
    country: "China",
    lat: 35.8617,
    lng: 104.1954,
    confirmed: 99311332,
    deaths: 121938,
    recovered: 99189394,
    active: 0,
    population: 1439323776,
    flag: "🇨🇳"
  },
  {
    country: "India",
    lat: 20.5937,
    lng: 78.9629,
    confirmed: 44999721,
    deaths: 530779,
    recovered: 44468942,
    active: 0,
    population: 1380004385,
    flag: "🇮🇳"
  },
  {
    country: "France",
    lat: 46.2276,
    lng: 2.2137,
    confirmed: 38997490,
    deaths: 174020,
    recovered: 38823470,
    active: 0,
    population: 65273511,
    flag: "🇫🇷"
  },
  {
    country: "Germany",
    lat: 51.1657,
    lng: 10.4515,
    confirmed: 38437756,
    deaths: 174979,
    recovered: 38262777,
    active: 0,
    population: 83783942,
    flag: "🇩🇪"
  },
  {
    country: "Brazil",
    lat: -14.2350,
    lng: -51.9253,
    confirmed: 37717062,
    deaths: 704659,
    recovered: 37012403,
    active: 0,
    population: 212559417,
    flag: "🇧🇷"
  },
  {
    country: "Japan",
    lat: 36.2048,
    lng: 138.2529,
    confirmed: 33320438,
    deaths: 74694,
    recovered: 33245744,
    active: 0,
    population: 126476461,
    flag: "🇯🇵"
  },
  {
    country: "South Korea",
    lat: 35.9078,
    lng: 127.7669,
    confirmed: 30562396,
    deaths: 34424,
    recovered: 30527972,
    active: 0,
    population: 51269185,
    flag: "🇰🇷"
  },
  {
    country: "Italy",
    lat: 41.8719,
    lng: 12.5674,
    confirmed: 25603510,
    deaths: 190357,
    recovered: 25413153,
    active: 0,
    population: 60461826,
    flag: "🇮🇹"
  },
  {
    country: "Russia",
    lat: 61.5240,
    lng: 105.3188,
    confirmed: 22075858,
    deaths: 381065,
    recovered: 21694793,
    active: 0,
    population: 145934462,
    flag: "🇷🇺"
  }
];

interface WorldMapProps {
  data?: CountryData[];
}

const WorldMap: React.FC<WorldMapProps> = ({ data = sampleCountriesData }) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if (mortalityRate > 3) return '#dc2626'; // Rouge
    if (mortalityRate > 2) return '#ea580c'; // Orange
    if (mortalityRate > 1) return '#eab308'; // Jaune
    return '#16a34a'; // Vert
  };

  // Formater les nombres
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Carte */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Carte Mondiale COVID-19</CardTitle>
              <CardDescription>
                Cliquez sur les marqueurs pour voir les détails par pays. 
                La taille indique le nombre de cas, la couleur le taux de mortalité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  maxBounds={[[-90, -180], [90, 180]]}
                  maxBoundsViscosity={1.0}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                        <div className="p-2 min-w-48">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{country.flag}</span>
                            <h3 className="font-bold text-lg">{country.country}</h3>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Cas confirmés:</span>
                              <span className="font-semibold text-blue-600">
                                {formatNumber(country.confirmed)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Décès:</span>
                              <span className="font-semibold text-red-600">
                                {formatNumber(country.deaths)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Guérisons:</span>
                              <span className="font-semibold text-green-600">
                                {formatNumber(country.recovered)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taux de mortalité:</span>
                              <span className="font-semibold">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Légende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Taille des marqueurs</h4>
                <p className="text-sm text-gray-600">
                  Plus le cercle est grand, plus le nombre de cas confirmés est élevé
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Couleurs</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>{'< 1%'} mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span>1-2% mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>2-3% mortalité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-600"></div>
                    <span>{'> 3%'} mortalité</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails du pays sélectionné */}
          {selectedCountry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  {selectedCountry.country}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Cas confirmés</p>
                    <p className="font-bold text-blue-600">
                      {formatNumber(selectedCountry.confirmed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Décès</p>
                    <p className="font-bold text-red-600">
                      {formatNumber(selectedCountry.deaths)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Guérisons</p>
                    <p className="font-bold text-green-600">
                      {formatNumber(selectedCountry.recovered)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cas actifs</p>
                    <p className="font-bold text-orange-600">
                      {formatNumber(selectedCountry.active)}
                    </p>
                  </div>
                </div>
                {selectedCountry.population && (
                  <div className="pt-2 border-t">
                    <p className="text-gray-600 text-sm">Population</p>
                    <p className="font-semibold">
                      {formatNumber(selectedCountry.population)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Taux d'infection: {((selectedCountry.confirmed / selectedCountry.population) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistiques globales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques Globales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total cas:</span>
                  <span className="font-semibold">
                    {formatNumber(data.reduce((sum, country) => sum + country.confirmed, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total décès:</span>
                  <span className="font-semibold text-red-600">
                    {formatNumber(data.reduce((sum, country) => sum + country.deaths, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total guérisons:</span>
                  <span className="font-semibold text-green-600">
                    {formatNumber(data.reduce((sum, country) => sum + country.recovered, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pays affichés:</span>
                  <span className="font-semibold">{data.length}</span>
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
