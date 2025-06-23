'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type DrinkHistoryItem = {
  drinkType: string;
  amount: number;
  timestamp: number;
};

export type DrinkHistoryState = {
  recentDrinks: DrinkHistoryItem[];
  lastUsedDrinkType: string;
  lastUsedAmount: number;
};

// Maximum number of recent drinks to store
const MAX_RECENT_DRINKS = 3;

export function useDrinkHistory() {
  const [drinkHistory, setDrinkHistory] = useLocalStorage<DrinkHistoryState>(
    'user-drink-history',
    {
      recentDrinks: [],
      lastUsedDrinkType: 'water',
      lastUsedAmount: 250
    }
  );

  // Add a new drink to history
  const addToHistory = (drinkType: string, amount: number) => {
    setDrinkHistory((prev: DrinkHistoryState) => {
      // Create new drink history item
      const newDrink: DrinkHistoryItem = {
        drinkType,
        amount,
        timestamp: Date.now()
      };

      // Keep only the latest unique drink types
      // Filter out duplicates of the same drink type
      const filteredDrinks = prev.recentDrinks.filter(
        (item: DrinkHistoryItem) => item.drinkType !== drinkType
      );

      // Add new drink to the beginning of the array
      const updatedDrinks = [newDrink, ...filteredDrinks].slice(0, MAX_RECENT_DRINKS);

      return {
        recentDrinks: updatedDrinks,
        lastUsedDrinkType: drinkType,
        lastUsedAmount: amount
      };
    });
  };

  // Clear history
  const clearHistory = () => {
    setDrinkHistory({
      recentDrinks: [],
      lastUsedDrinkType: 'water',
      lastUsedAmount: 250
    });
  };

  return {
    recentDrinks: drinkHistory.recentDrinks,
    lastUsedDrinkType: drinkHistory.lastUsedDrinkType,
    lastUsedAmount: drinkHistory.lastUsedAmount,
    addToHistory,
    clearHistory
  };
}
