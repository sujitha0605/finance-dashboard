import { useMemo } from 'react';

/**
 * Custom hook to abstract financial logic out of UI components.
 * This demonstrates advanced React architecture by isolating complex math into a reusable, memoized hook.
 */
export function useFinanceData(transactions, selectedScope = "all") {
  return useMemo(() => {
    // 1. Determine local scoped view
    const viewTx = selectedScope === "all" ? transactions : transactions.filter(t => t.userEmail === selectedScope);
    
    // 2. High-level totals
    const totalRevenue = viewTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = viewTx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Time Series Graph Construction
    let scopeBalance = 0;
    const timeAggregated = [...viewTx].reverse().map(t => {
      if (t.type === 'income') scopeBalance += t.amount;
      else scopeBalance -= t.amount;
      return { date: t.date, balance: scopeBalance, income: t.type === 'income' ? t.amount : 0, expense: t.type === 'expense' ? t.amount : 0 };
    }).reduce((acc, curr) => {
      const existing = acc.find(a => a.date === curr.date);
      if (existing) {
        existing.income += curr.income;
        existing.expense += curr.expense;
        existing.balance = curr.balance; 
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []);

    // 4. Global Leaderboard Maps
    const userExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      const uEmail = t.userEmail || "Unassigned Record";
      if (!acc[uEmail]) acc[uEmail] = { total: 0, categories: {} };
      acc[uEmail].total += t.amount;
      if (!acc[uEmail].categories[t.category]) acc[uEmail].categories[t.category] = 0;
      acc[uEmail].categories[t.category] += t.amount;
      return acc;
    }, {});

    const topSpender = Object.entries(userExpenses).reduce((prev, [email, data]) => {
      return (data.total > prev.total) ? { email, ...data } : prev;
    }, { email: 'None', total: -1, categories: {} });

    const spenderRankings = Object.entries(userExpenses).map(([email, data]) => ({
      name: email.split('@')[0],
      value: data.total
    })).sort((a,b) => b.value - a.value).slice(0, 5);

    // 5. Global Category Aggregation
    const globalCategoryMap = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    const globalCategoryData = Object.entries(globalCategoryMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 6. Individual Isolated Categories (For Personal Insights)
    const specificUserCategories = viewTx.filter(t => t.type === 'expense').reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {});
    
    const topPersonalCategory = Object.entries(specificUserCategories).reduce((prev, [cat, amount]) => {
      return (amount > prev.amount) ? { cat, amount } : prev;
    }, { cat: 'None', amount: 0 });

    const personalCategoryData = Object.entries(specificUserCategories).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);

    // Return the perfectly structured payload back to the component
    return {
      viewTx,
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense,
      timeAggregated,
      userExpenses,
      topSpender,
      spenderRankings,
      globalCategoryData,
      topPersonalCategory,
      personalCategoryData
    };
  }, [transactions, selectedScope]);
}
