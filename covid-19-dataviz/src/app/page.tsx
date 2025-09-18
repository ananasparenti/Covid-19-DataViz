'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCovid } from '@/contexts/covid-context';
import { formatNumber } from '@/lib/utils';

export default function Home() {
  const { global, loading, error, lastUpdate, topCountries, loadData } = useCovid();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-400">Erreur de chargement</h1>
            <p className="text-gray-400">{error}</p>
          </div>
          <Button onClick={loadData} variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-800">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const getTrendIcon = (todayValue: number) => {
    if (todayValue > 0) return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (todayValue < 0) return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (todayValue: number) => {
    if (todayValue > 0) return "text-red-400";
    if (todayValue < 0) return "text-green-400";
    return "text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">COVID-19 Dashboard</h1>
          <p className="text-gray-400">
            Visualisation en temps réel des données de la pandémie mondiale
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Dernière mise à jour : {lastUpdate}
            </p>
          )}
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="border-gray-600 text-gray-200 hover:bg-gray-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      
      {/* Global Statistics Cards */}
      {global && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Cas confirmés"
            value={global.confirmed}
            todayValue={global.todayCases}
            variant="secondary"
            description="Total des cas confirmés"
          />
          
          <StatsCard
            title="Décès"
            value={global.deaths}
            todayValue={global.todayDeaths}
            variant="destructive"
            description="Total des décès"
          />
          
          <StatsCard
            title="Guérisons"
            value={global.recovered}
            todayValue={0} // API ne fournit plus les guérisons du jour
            variant="default"
            description="Total des guérisons"
          />
          
          <StatsCard
            title="Cas actifs"
            value={global.active}
            todayValue={0}
            variant="outline"
            description="Cas en cours de traitement"
          />
        </div>
      )}

      {/* Top Countries */}
      {topCountries && topCountries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-100">Top 10 des pays les plus touchés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topCountries.slice(0, 10).map((country: any, index: number) => (
              <CountryCard
                key={country.country}
                country={country}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour les cartes de statistiques
interface StatsCardProps {
  title: string;
  value: number;
  todayValue: number;
  variant: "default" | "destructive" | "outline" | "secondary";
  description: string;
}

function StatsCard({ title, value, todayValue, variant, description }: StatsCardProps) {
  const getTrendIcon = (todayValue: number) => {
    if (todayValue > 0) return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (todayValue < 0) return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (todayValue: number) => {
    if (todayValue > 0) return "text-red-400";
    if (todayValue < 0) return "text-green-400";
    return "text-gray-400";
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
        <Badge variant={variant} className="bg-gray-700 text-gray-200 border-gray-600">Total</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-100">{formatNumber(value)}</div>
        <div className={`flex items-center text-xs ${getTrendColor(todayValue)}`}>
          {getTrendIcon(todayValue)}
          <span className="ml-1">
            {todayValue > 0 ? '+' : ''}{formatNumber(todayValue)} aujourd'hui
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Composant pour les cartes de pays
interface CountryCardProps {
  country: {
    country: string;
    confirmed: number;
    deaths: number;
    recovered: number;
    flag?: string;
  };
  rank: number;
}

function CountryCard({ country, rank }: CountryCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow bg-gray-900 border-gray-700 hover:border-gray-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {country.flag && (
              <img 
                src={country.flag} 
                alt={`${country.country} flag`}
                className="w-6 h-4 object-cover rounded"
              />
            )}
            <CardTitle className="text-lg text-gray-100">{country.country}</CardTitle>
          </div>
          <Badge variant="outline" className="border-gray-600 text-gray-300">#{rank}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-400">Cas</p>
            <p className="font-semibold text-blue-400">{formatNumber(country.confirmed)}</p>
          </div>
          <div>
            <p className="text-gray-400">Décès</p>
            <p className="font-semibold text-red-400">{formatNumber(country.deaths)}</p>
          </div>
          <div>
            <p className="text-gray-400">Guérisons</p>
            <p className="font-semibold text-green-400">{formatNumber(country.recovered)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant de loading
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 bg-gray-800" />
          <Skeleton className="h-4 w-96 mt-2 bg-gray-800" />
          <Skeleton className="h-3 w-48 mt-2 bg-gray-800" />
        </div>
        <Skeleton className="h-9 w-24 bg-gray-800" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
            <CardHeader className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-gray-800" />
                <Skeleton className="h-5 w-12 bg-gray-800" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 bg-gray-800" />
              <Skeleton className="h-4 w-28 mt-2 bg-gray-800" />
              <Skeleton className="h-3 w-32 mt-1 bg-gray-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top countries skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64 bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-6 h-4 rounded bg-gray-800" />
                    <Skeleton className="h-5 w-24 bg-gray-800" />
                  </div>
                  <Skeleton className="h-5 w-8 bg-gray-800" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-8 bg-gray-800" />
                      <Skeleton className="h-4 w-12 mt-1 bg-gray-800" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}