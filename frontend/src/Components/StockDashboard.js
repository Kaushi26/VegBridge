import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const FarmerStockDashboard = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch user data from localStorage
  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem('userDetails'));
    if (!user) {
      setError('You must be logged in.');
      return;
    }

    const { name, city, address, email, id } = user;
    setUserDetails({ name, city, address, email, id });
  };

  useEffect(() => {
    // Fetch user data when the component mounts
    fetchUserData();
  }, []);

  useEffect(() => {
    // Fetch stock details for the logged-in farmer
    const fetchStocks = async () => {
      if (!userDetails?.name) return;
      try {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        const response = await axios.get(
          `${apiURL}/api/products/stocks/${encodeURIComponent(userDetails.name)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to the request headers
            },
          }
        );
        if (response.data && response.data.length > 0) {
          setStocks(response.data);
        } else {
          setError('No stocks found for this farmer.');
        }
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError(err.response?.data?.message || 'Error fetching stock details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [userDetails, apiURL]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  if (stocks.length === 0) {
    return <div>No stocks found for this farmer.</div>;
  }

  // Aggregate stock quantities by grade, ensuring all 4 grades are displayed
  const grades = ['Underripe', 'Ripe', 'Overripe', 'About to Spoil'];
  const stockByGrade = grades.reduce((acc, grade) => {
    // Use filter to find all stocks with the same grade
    const stocksForGrade = stocks.filter(s => s.grade === grade);
    // Sum the quantities of all matching stocks
    acc[grade] = stocksForGrade.reduce((total, stock) => total + stock.quantity, 0);
    return acc;
  }, {});

  // Prepare data for the chart
  const quantities = grades.map(grade => stockByGrade[grade]);

  // Colors using green shades
  const greenShades = [
    '#A5D6A7', // Underripe - light green
    '#81C784', // Ripe - medium green
    '#4CAF50', // Overripe - darker green
    '#388E3C', // About to spoil - very dark green
  ];

  const chartData = {
    labels: grades, // Grades (e.g., Underripe, Ripe, etc.)
    datasets: [
      {
        label: 'Stock Quantity (kg)',
        data: quantities, // Corresponding quantities for each grade
        backgroundColor: greenShades, // Green shades
        borderColor: '#000',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to stretch within its container
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="container mt-5 p-3">
      <br />
      <br />
      <div className="card p-3">
        <h4>Stock Dashboard of {userDetails?.name}</h4>
        <div className="chart-container" style={{ width: '72.5%', height: '450px', margin: '0 auto' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default FarmerStockDashboard;
