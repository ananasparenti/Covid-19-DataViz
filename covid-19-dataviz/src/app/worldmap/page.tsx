'use client';

import React from 'react';
import WorldMap from '@/components/WorldMap';

const WorldMapPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">World Map - Covid-19 Data Visualization</h1>
                <p className="text-muted-foreground">
                    Interactive visualizations of Covid-19 data across the globe. Click on the markers to see detailed statistics for each country.
                </p>
            </div>
            
            <WorldMap />
        </div>
    );
};

export default WorldMapPage;