/**
 * Comprehensive Expense Tracking System
 * Budget management, expense sharing, and analytics
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';

import { 
  Text, 
  Button, 
  Card, 
  Badge, 
  Input,
  Modal 
} from '@/components/ui';
import {
  DollarSign as CurrencyIcon,
  Plus as PlusIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendIcon,
  Users as SplitIcon,
  Filter as FilterIcon,
} from '@/components/ui/icons';

interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  location?: string;
  receipt?: string; // File URL
  paidBy: string; // Participant ID
  splitBetween: ExpenseSplit[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
}

interface ExpenseSplit {
  participantId: string;
  amount: number;
  percentage?: number;
  approved: boolean;
}

enum ExpenseCategory {
  TRANSPORTATION = 'transportation',
  ACCOMMODATION = 'accommodation',
  DINING = 'dining',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  ACTIVITIES = 'activities',
  OTHER = 'other',
}

interface ExpenseTrackerProps {
  tripId: string;
  budget?: {
    total: number;
    currency: string;
    categories: Record<ExpenseCategory, number>;
  };
}

const categoryConfig = {
  transportation: { icon: '🚗', color: '#0ea5e9', label: 'Transport' },
  accommodation: { icon: '🏨', color: '#8b5cf6', label: 'Hotels' },
  dining: { icon: '🍽️', color: '#f59e0b', label: 'Dining' },
  entertainment: { icon: '🎭', color: '#ec4899', label: 'Entertainment' },
  shopping: { icon: '🛍️', color: '#06b6d4', label: 'Shopping' },
  activities: { icon: '🎯', color: '#22c55e', label: 'Activities' },
  other: { icon: '📝', color: '#6b7280', label: 'Other' },
};

/**
 * Main expense tracker component
 */
export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  tripId,
  budget,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [showBudgetOverview, setShowBudgetOverview] = useState(false);

  // Calculate expense analytics
  const analytics = useMemo(() => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const byCategory = Object.values(ExpenseCategory).reduce((acc, category) => {
      acc[category] = expenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    const budgetUsage = budget ? (totalSpent / budget.total) * 100 : 0;
    
    return {
      totalSpent,
      byCategory,
      budgetUsage,
      averageDaily: totalSpent / 7, // Assuming week-long trip
      largestExpense: Math.max(...expenses.map(e => e.amount), 0),
    };
  }, [expenses, budget]);

  const filteredExpenses = selectedCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === selectedCategory);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header with Budget Overview */}
      <View className="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">
            Trip Expenses
          </Text>
          
          <Button
            variant="primary"
            size="sm"
            onPress={() => setShowAddExpense(true)}
          >
            <PlusIcon color="white" width={16} height={16} />
            <Text className="ml-2 text-white font-medium">Add Expense</Text>
          </Button>
        </View>

        {/* Budget Summary */}
        {budget && (
          <Card variant={analytics.budgetUsage > 100 ? 'error' : analytics.budgetUsage > 80 ? 'warning' : 'success'}>
            <Card.Body>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                  Budget Overview
                </Text>
                <Badge 
                  variant={analytics.budgetUsage > 100 ? 'error' : analytics.budgetUsage > 80 ? 'warning' : 'success'}
                >
                  {Math.round(analytics.budgetUsage)}% used
                </Badge>
              </View>
              
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {budget.currency} {analytics.totalSpent.toLocaleString()}
                  </Text>
                  <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                    of {budget.currency} {budget.total.toLocaleString()} budget
                  </Text>
                </View>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowBudgetOverview(true)}
                >
                  <TrendIcon color="#737373" width={16} height={16} />
                  <Text className="ml-1 text-neutral-600 dark:text-neutral-400 text-xs">
                    Details
                  </Text>
                </Button>
              </View>
              
              {/* Budget Progress Bar */}
              <View className="mt-3 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                <View 
                  className={`h-2 rounded-full ${
                    analytics.budgetUsage > 100 
                      ? 'bg-error-500' 
                      : analytics.budgetUsage > 80 
                        ? 'bg-warning-500' 
                        : 'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(analytics.budgetUsage, 100)}%` }}
                />
              </View>
            </Card.Body>
          </Card>
        )}
      </View>

      {/* Category Filter */}
      <View className="p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setSelectedCategory('all')}
            >
              <Text className={selectedCategory === 'all' ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}>
                All
              </Text>
            </Button>
            
            {Object.entries(categoryConfig).map(([key, config]) => {
              const category = key as ExpenseCategory;
              const categoryTotal = analytics.byCategory[category] || 0;
              const isSelected = selectedCategory === category;
              
              return (
                <Button
                  key={category}
                  variant={isSelected ? 'primary' : 'ghost'}
                  size="sm"
                  onPress={() => setSelectedCategory(category)}
                  className="flex-row items-center"
                >
                  <Text className="mr-2">{config.icon}</Text>
                  <Text className={isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}>
                    {config.label}
                  </Text>
                  {categoryTotal > 0 && (
                    <Badge 
                      variant={isSelected ? 'secondary' : 'primary'}
                      size="sm"
                      className="ml-2"
                    >
                      {categoryTotal}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Expenses List */}
      <View className="px-4 pb-4">
        {filteredExpenses.length === 0 ? (
          <Card>
            <Card.Body className="items-center py-8">
              <ReceiptIcon color="#a3a3a3" width={32} height={32} />
              <Text className="mt-4 text-base font-medium text-neutral-900 dark:text-white text-center">
                No Expenses Yet
              </Text>
              <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 text-center">
                Start tracking expenses to stay within budget
              </Text>
              <Button
                variant="primary"
                onPress={() => setShowAddExpense(true)}
                className="mt-4"
              >
                <PlusIcon color="white" width={16} height={16} />
                <Text className="ml-2 text-white font-medium">Add First Expense</Text>
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <View className="space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onUpdate={(updates) => {
                  setExpenses(prev => 
                    prev.map(e => e.id === expense.id ? { ...e, ...updates } : e)
                  );
                }}
                onDelete={() => {
                  setExpenses(prev => prev.filter(e => e.id !== expense.id));
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Add Expense Modal */}
      <ExpenseForm
        visible={showAddExpense}
        tripId={tripId}
        onSubmit={addExpense}
        onClose={() => setShowAddExpense(false)}
      />

      {/* Budget Overview Modal */}
      <BudgetOverviewModal
        visible={showBudgetOverview}
        budget={budget}
        analytics={analytics}
        onClose={() => setShowBudgetOverview(false)}
      />
    </ScrollView>
  );
};

/**
 * Individual expense card component
 */
const ExpenseCard: React.FC<{
  expense: Expense;
  onUpdate: (updates: Partial<Expense>) => void;
  onDelete: () => void;
}> = ({ expense, onUpdate, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const categoryConfig = categoryConfig[expense.category];

  return (
    <Card interactive onPress={() => setShowActions(!showActions)}>
      <Card.Body>
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{categoryConfig.icon}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {expense.title}
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                {expense.location} • {new Date(expense.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View className="items-end">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {expense.currency} {expense.amount.toLocaleString()}
            </Text>
            <Badge 
              variant={expense.status === 'approved' ? 'success' : 'warning'}
              size="sm"
            >
              {expense.status}
            </Badge>
          </View>
        </View>

        {/* Split Information */}
        {expense.splitBetween.length > 1 && (
          <View className="mt-3 flex-row items-center">
            <SplitIcon color="#737373" width={16} height={16} />
            <Text className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
              Split between {expense.splitBetween.length} people
            </Text>
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View className="flex-row space-x-2 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="outline" size="sm" className="flex-1">
              <Text className="text-neutral-700 dark:text-neutral-300 text-sm">Edit</Text>
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Text className="text-neutral-700 dark:text-neutral-300 text-sm">Split</Text>
            </Button>
            <Button variant="destructive" size="sm" onPress={onDelete}>
              <Text className="text-white text-sm">Delete</Text>
            </Button>
          </View>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * Expense creation form
 */
const ExpenseForm: React.FC<{
  visible: boolean;
  tripId: string;
  onSubmit: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}> = ({ visible, tripId, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [currency] = useState('USD'); // Would be configurable

  const handleSubmit = () => {
    if (!title || !amount) return;

    onSubmit({
      tripId,
      title,
      amount: parseFloat(amount),
      currency,
      category,
      date: new Date().toISOString(),
      paidBy: 'current-user', // Would get from auth
      splitBetween: [],
      status: 'pending',
    });

    // Reset form
    setTitle('');
    setAmount('');
    setCategory(ExpenseCategory.OTHER);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} size="lg">
      <View className="p-6">
        <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Add Expense
        </Text>

        <View className="space-y-4">
          <Input
            placeholder="Expense title"
            value={title}
            onChangeText={setTitle}
          />

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Input
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="w-20">
              <Input
                value={currency}
                editable={false}
                className="bg-neutral-100 dark:bg-neutral-700"
              />
            </View>
          </View>

          {/* Category Selection */}
          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const cat = key as ExpenseCategory;
                  const isSelected = category === cat;
                  
                  return (
                    <Button
                      key={cat}
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => setCategory(cat)}
                      className="flex-row items-center"
                    >
                      <Text className="mr-2">{config.icon}</Text>
                      <Text className={isSelected ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'}>
                        {config.label}
                      </Text>
                    </Button>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        <View className="flex-row space-x-3 mt-6">
          <Button variant="outline" onPress={onClose} className="flex-1">
            <Text className="text-neutral-700 dark:text-neutral-300">Cancel</Text>
          </Button>
          <Button 
            variant="primary" 
            onPress={handleSubmit}
            disabled={!title || !amount}
            className="flex-1"
          >
            <Text className="text-white font-medium">Add Expense</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Budget overview modal
 */
const BudgetOverviewModal: React.FC<{
  visible: boolean;
  budget?: any;
  analytics: any;
  onClose: () => void;
}> = ({ visible, budget, analytics, onClose }) => {
  return (
    <Modal visible={visible} onClose={onClose} size="lg">
      <View className="p-6">
        <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Budget Analysis
        </Text>
        
        <Card>
          <Card.Body>
            <Text className="text-center text-neutral-600 dark:text-neutral-400">
              Budget analytics coming soon...
            </Text>
          </Card.Body>
        </Card>

        <Button variant="outline" onPress={onClose} className="mt-6">
          <Text className="text-neutral-700 dark:text-neutral-300">Close</Text>
        </Button>
      </View>
    </Modal>
  );
};