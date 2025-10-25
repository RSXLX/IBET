'use client';

import { useState, useEffect } from 'react';
import { Market } from '@/types';

interface UseMarketsOptions {
  category?: string;
  limit?: number;
  trending?: boolean;
}

export function useMarkets(options: UseMarketsOptions = {}) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for now - replace with actual API call
        const mockMarkets: Market[] = [
          {
            id: '1',
            title: 'Will Bitcoin reach $100,000 by the end of 2024?',
            description: 'Bitcoin price prediction for 2024',
            imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
            category: 'crypto',
            endDate: new Date('2024-12-31'),
            resolved: false,
            totalVolume: 125000,
            participants: 1234,
            probability: 0.65,
            upPercentage: 65,
            downPercentage: 35,
            creator: '0x1234...5678',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            title: 'Will the Lakers win the NBA Championship 2024?',
            description: 'NBA Championship prediction',
            imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
            category: 'sports',
            endDate: new Date('2024-06-20'),
            resolved: false,
            totalVolume: 89000,
            participants: 892,
            probability: 0.32,
            upPercentage: 32,
            downPercentage: 68,
            creator: '0x2345...6789',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            title: 'Will AI replace 50% of jobs by 2030?',
            description: 'AI impact on employment prediction',
            imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
            category: 'tech',
            endDate: new Date('2030-01-01'),
            resolved: false,
            totalVolume: 67000,
            participants: 567,
            probability: 0.78,
            upPercentage: 78,
            downPercentage: 22,
            creator: '0x3456...7890',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            title: 'Will Ethereum 2.0 staking reach 20M ETH by Q2 2024?',
            description: 'Ethereum staking milestone prediction',
            imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
            category: 'crypto',
            endDate: new Date('2024-06-30'),
            resolved: false,
            totalVolume: 156000,
            participants: 2341,
            probability: 0.55,
            upPercentage: 55,
            downPercentage: 45,
            creator: '0x4567...8901',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '5',
            title: 'Will the US Fed cut interest rates in 2024?',
            description: 'Federal Reserve monetary policy prediction',
            imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
            category: 'economy',
            endDate: new Date('2024-12-31'),
            resolved: false,
            totalVolume: 234000,
            participants: 3456,
            probability: 0.72,
            upPercentage: 72,
            downPercentage: 28,
            creator: '0x5678...9012',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Filter by category if specified
        let filteredMarkets = mockMarkets;
        if (options.category) {
          filteredMarkets = mockMarkets.filter(market => market.category === options.category);
        }

        // Sort by trending if specified
        if (options.trending) {
          filteredMarkets.sort((a, b) => b.totalVolume - a.totalVolume);
        }

        // Limit results if specified
        if (options.limit) {
          filteredMarkets = filteredMarkets.slice(0, options.limit);
        }

        setMarkets(filteredMarkets);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch markets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, [options.category, options.limit, options.trending]);

  return { markets, isLoading, error };
}