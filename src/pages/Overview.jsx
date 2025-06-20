import React from 'react';
import './Dashboard.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const Overview = () => {
  const overviewData = {
    totalEvents: 1200000,
    validEvents: 900000,
    errorEvents: 300000,
    uniqueUsers: 50000,
    errorRate: 25,
  };

  const eventTracking = [
    { name: 'view_item_list', total: 500000, errors: 10 },
    { name: 'page_view', total: 300000, errors: 5 },
    { name: 'purchase', total: 10000, errors: 2 },
  ];

  const paramAnalysis = [
    { name: 'page_type_level1', value: 48 },
    { name: 'page_type_level2', value: 30 },
    { name: 'page_type_level3', value: 22 },
    { name: 'user_id', value: 1.5 },
  ];

  const barColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50'];

  const donutData = [
    { name: 'Valid', value: overviewData.validEvents },
    { name: 'Errors', value: overviewData.errorEvents },
  ];

  const donutColors = ['#00c49f', '#ff6b6b'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
      </div>

      <section className="overview-stats">
        <div className="stat-card">
          <h3>Total Events</h3>
          <p>{overviewData.totalEvents.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Valid Events</h3>
          <p>{overviewData.validEvents.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Error Events</h3>
          <p>{overviewData.errorEvents.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Users</h3>
          <p>{overviewData.uniqueUsers.toLocaleString()}</p>
        </div>
        <div className="stat-card donut-card">
          <h3>Error Rate</h3>
          <div className="donut-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={5}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="tracking-section">
        <h2>Event Tracking</h2>
        <table className="overview-event-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Total</th>
              <th>Error %</th>
            </tr>
          </thead>
          <tbody>
            {eventTracking.map((event, index) => (
              <tr key={index}>
                <td>{event.name}</td>
                <td>{event.total.toLocaleString()}</td>
                <td>{event.errors}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="params-section">
        <h2>Parameter Analysis</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={paramAnalysis}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
            >
              <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {paramAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Overview;