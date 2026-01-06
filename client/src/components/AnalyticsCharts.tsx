
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

const categoryData = [
  { name: 'Road Issues', value: 3, fill: '#FF6B6B' },
  { name: 'Water Supply', value: 2, fill: '#4ECDC4' },
  { name: 'Street Lighting', value: 2, fill: '#45B7D1' },
  { name: 'Garbage', value: 1, fill: '#96CEB4' },
  { name: 'Drainage', value: 1, fill: '#FFEAA7' }
];

const statusData = [
  { name: 'Resolved', value: 6, fill: '#00B894' },
  { name: 'Pending', value: 3, fill: '#FDCB6E' }
];

const chartConfig = {
  category: {
    label: "Category Distribution"
  },
  status: {
    label: "Status Overview"
  }
};

const AnalyticsCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Complaints by Category</CardTitle>
          <CardDescription>Distribution of issues reported</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Status</CardTitle>
          <CardDescription>Solved vs Pending complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#8884d8" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
