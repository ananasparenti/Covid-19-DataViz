"use client"

import * as React from "react"
import { ExternalLink, Clock, Calendar, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  date: string
  category: string
  url: string
  readTime: number
}

const newsData: NewsItem[] = [
  {
    id: "1",
    title: "Nouvelles recommandations de l'OMS pour la prévention du COVID-19",
    summary: "L'Organisation mondiale de la santé publie de nouvelles directives concernant les mesures préventives contre le COVID-19, incluant des recommandations sur la ventilation et les masques.",
    source: "Organisation Mondiale de la Santé",
    date: "2025-10-08",
    category: "Santé publique",
    url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
    readTime: 5
  },
  {
    id: "2",
    title: "Évolution des variants COVID-19 : Point scientifique",
    summary: "Les dernières recherches montrent l'évolution continue des variants du SARS-CoV-2 et leur impact sur l'efficacité des vaccins actuels.",
    source: "Nature Medicine",
    date: "2025-10-07",
    category: "Recherche",
    url: "https://www.nature.com/nm/",
    readTime: 8
  },
  {
    id: "3",
    title: "Impact économique post-pandémie : Rapport 2025",
    summary: "Analyse complète des répercussions économiques de la pandémie COVID-19 sur les marchés mondiaux et les perspectives de reprise.",
    source: "FMI - Fonds Monétaire International",
    date: "2025-10-06",
    category: "Économie",
    url: "https://www.imf.org/",
    readTime: 12
  },
  {
    id: "4",
    title: "Vaccination COVID-19 : Mise à jour des données mondiales",
    summary: "Les dernières statistiques sur les campagnes de vaccination dans le monde, avec un focus sur l'équité vaccinale et l'accès aux doses.",
    source: "Our World in Data",
    date: "2025-10-05",
    category: "Vaccination",
    url: "https://ourworldindata.org/covid-vaccinations",
    readTime: 6
  },
  {
    id: "5",
    title: "Technologies de diagnostic rapide : Innovations 2025",
    summary: "Présentation des nouvelles technologies de dépistage rapide du COVID-19, incluant les tests salivaires et les détecteurs portables.",
    source: "MIT Technology Review",
    date: "2025-10-04",
    category: "Technologie",
    url: "https://www.technologyreview.com/",
    readTime: 7
  },
  {
    id: "6",
    title: "Santé mentale et COVID-19 : Étude longitudinale",
    summary: "Résultats d'une étude de 3 ans sur l'impact psychologique de la pandémie, avec des recommandations pour le soutien mental.",
    source: "The Lancet Psychiatry",
    date: "2025-10-03",
    category: "Santé mentale",
    url: "https://www.thelancet.com/journals/lanpsy/home",
    readTime: 10
  }
]

const categoryColors = {
  "Santé publique": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Recherche": "bg-purple-500/20 text-purple-300 border border-purple-500/30", 
  "Économie": "bg-green-500/20 text-green-300 border border-green-500/30",
  "Vaccination": "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "Technologie": "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  "Santé mentale": "bg-pink-500/20 text-pink-300 border border-pink-500/30"
}

export function NewsFeed() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
          Actualités COVID-19
        </h2>
        <p className="text-gray-400">
          Les dernières informations, recherches et développements concernant la pandémie de COVID-19
        </p>
      </div>

      {/* Ressources rapides */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Ressources officielles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4 bg-gray-900 border-gray-700 hover:bg-gray-800" asChild>
            <a href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019" target="_blank" rel="noopener noreferrer">
              <div className="text-left">
                <div className="font-medium text-gray-100">OMS - COVID-19</div>
                <div className="text-sm text-gray-400">Informations officielles</div>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </a>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4 bg-gray-900 border-gray-700 hover:bg-gray-800" asChild>
            <a href="https://www.santepubliquefrance.fr/dossiers/coronavirus-covid-19" target="_blank" rel="noopener noreferrer">
              <div className="text-left">
                <div className="font-medium text-gray-100">Santé Publique France</div>
                <div className="text-sm text-gray-400">Données nationales</div>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </a>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto p-4 bg-gray-900 border-gray-700 hover:bg-gray-800" asChild>
            <a href="https://ourworldindata.org/coronavirus" target="_blank" rel="noopener noreferrer">
              <div className="text-left">
                <div className="font-medium text-gray-100">Our World in Data</div>
                <div className="text-sm text-gray-400">Statistiques mondiales</div>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </a>
          </Button>
        </div>
      </div>

      {/* Articles de presse */}
      <div className="grid gap-6">
        {newsData.map((article) => (
          <Card key={article.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-200 hover:scale-[1.02]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={categoryColors[article.category as keyof typeof categoryColors]}
                    >
                      {article.category}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {article.readTime} min
                    </div>
                  </div>
                  <CardTitle className="text-xl leading-tight text-gray-100 hover:text-blue-400 transition-colors">
                    {article.title}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-base leading-relaxed text-gray-300">
                {article.summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="mr-4">{formatDate(article.date)}</span>
                  <span className="font-medium text-gray-300">{article.source}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" asChild>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    Lire l&apos;article
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer avec liens supplémentaires */}
      <div className="mt-12 p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Autres ressources utiles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-200">Recherche scientifique</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="https://www.ncbi.nlm.nih.gov/research/coronavirus/" 
                   target="_blank" rel="noopener noreferrer" 
                   className="text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  NCBI - Recherche Coronavirus
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://www.medrxiv.org/" 
                   target="_blank" rel="noopener noreferrer" 
                   className="text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  medRxiv - Prépublications médicales
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-200">Données et statistiques</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="https://github.com/CSSEGISandData/COVID-19" 
                   target="_blank" rel="noopener noreferrer" 
                   className="text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  Johns Hopkins CSSE - Données COVID-19
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://covidtracking.com/" 
                   target="_blank" rel="noopener noreferrer" 
                   className="text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  COVID Tracking Projects
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}