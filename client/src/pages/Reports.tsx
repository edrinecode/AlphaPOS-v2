import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  // Get date range for period
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();
  const branchId = selectedBranch !== "all" ? parseInt(selectedBranch) : undefined;

  const { data: sales } = trpc.sales.list.useQuery({
    branchId,
    startDate,
    endDate,
  });

  const { data: expenses } = trpc.expenses.list.useQuery({
    branchId,
    startDate,
    endDate,
  });

  // Calculate metrics
  const totalSales = sales?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0;
  const totalCost = sales?.reduce((sum, s) => sum + parseFloat(s.cost?.toString() || "0"), 0) || 0;
  const grossProfit = totalSales - totalCost;
  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
  const netProfit = grossProfit - totalExpenses;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!sales) return [];
    
    const grouped: Record<string, any> = {};
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { date, sales: 0, expenses: 0, profit: 0 };
      }
      grouped[date].sales += parseFloat(sale.amount.toString());
      grouped[date].profit += parseFloat(sale.amount.toString()) - parseFloat(sale.cost?.toString() || "0");
    });

    expenses?.forEach((expense) => {
      const date = new Date(expense.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { date, sales: 0, expenses: 0, profit: 0 };
      }
      grouped[date].expenses += parseFloat(expense.amount.toString());
      grouped[date].profit -= parseFloat(expense.amount.toString());
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, expenses]);

  const profitData = [
    { name: "Gross Profit", value: Math.max(0, grossProfit) },
    { name: "Expenses", value: Math.max(0, totalExpenses) },
    { name: "Net Profit", value: Math.max(0, netProfit) },
  ];

  const branchMap = branches?.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});

  // Prepare transaction history
  const allTransactions = useMemo(() => {
    const transactions: any[] = [];
    
    sales?.forEach((sale) => {
      transactions.push({
        date: new Date(sale.createdAt),
        type: "Sale",
        description: sale.itemName,
        branch: branchMap?.[sale.branchId as keyof typeof branchMap] || "Unknown",
        amount: parseFloat(sale.amount.toString()),
        profit: parseFloat(sale.amount.toString()) - parseFloat(sale.cost?.toString() || "0"),
      });
    });

    expenses?.forEach((expense) => {
      transactions.push({
        date: new Date(expense.createdAt),
        type: "Expense",
        description: expense.title,
        branch: branchMap?.[expense.branchId as keyof typeof branchMap] || "Unknown",
        amount: -parseFloat(expense.amount.toString()),
        profit: -parseFloat(expense.amount.toString()),
      });
    });

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sales, expenses, branchMap]);

  const handleExport = () => {
    const csv = [
      ["Date", "Type", "Description", "Branch", "Amount", "Profit/Loss"],
      ...allTransactions.map((t) => [
        t.date.toLocaleDateString(),
        t.type,
        t.description,
        t.branch,
        `$${t.amount.toFixed(2)}`,
        `$${t.profit.toFixed(2)}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alphapos-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Sales, expenses, and profit analytics</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{sales?.length || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{expenses?.length || 0} items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${grossProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{((grossProfit / totalSales) * 100 || 0).toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{((netProfit / totalSales) * 100 || 0).toFixed(1)}% of sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales vs Expenses Trend</CardTitle>
            <CardDescription>Daily sales and expenses over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Sales" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Breakdown</CardTitle>
            <CardDescription>Distribution of profit and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All sales and expenses for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.map((transaction, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "Sale"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.branch}</TableCell>
                    <TableCell className="text-right font-semibold">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-semibold ${transaction.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${transaction.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
