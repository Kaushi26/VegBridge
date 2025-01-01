import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './Components/ProductContext';
import { CartProvider } from './Components/CartContext';
import 'font-awesome/css/font-awesome.min.css';
import Navbar from './Components/Navigation';
import Navbar2 from './Components/App-Navbar';
import HomePicture from './Components/Homepic';
import Homepage from './Components/Home';
import RegisterForm from './Components/Register';
import LoginSection from './Components/login';
import FarmerMarketplace from './Components/FarmerMarketplace';
import BusinessMarketplace from './Components/BusinessMarketplace';
import AdminMarketplace from './Components/AdminMarketplace';
import AddToCart from './Components/Add to cart';
import AddListing from './Components/Add listing';
import Checkout from './Components/checkout';
import FarmerStockDashboard from './Components/StockDashboard';
import FarmerTransactions from './Components/FarmerTransactions';
import BusinessTransactions from './Components/BusinessTransactions';
import AdminTransactions from './Components/AdminTransactions';
import AddGuide from './Components/Add guide';
import Footer from './Components/Footer';
import Footer2 from './Components/App-Footer';
import FarmerViewGuides from './Components/Farmer Guides';
import AdminViewGuides from './Components/A-Guides';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => JSON.parse(localStorage.getItem('isLoggedIn')) || false
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('userRole') || ''
  );

  useEffect(() => {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    localStorage.setItem('userRole', userRole);
  }, [isLoggedIn, userRole]);

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const RenderNavbar = () =>
    isLoggedIn ? <Navbar2 setIsLoggedIn={setIsLoggedIn} /> : <Navbar />;

  const RenderFooter = () => (isLoggedIn ? <Footer2 /> : <Footer />);

  return (
    <CartProvider>
      <ProductProvider>
        <Router>
          <RenderNavbar />
          {!isLoggedIn && <HomePicture />}
          <div style={{ minHeight: '80vh' }}>
            <Routes>
              <Route
                path="/"
                element={
                  !isLoggedIn ? (
                    <Homepage />
                  ) : (
                    <MarketplaceSelector userRole={userRole} />
                  )
                }
              />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/login"
                element={<LoginSection onLoginSuccess={handleLoginSuccess} />}
              />
              <Route
                path="/farmer-transactions"
                element={isLoggedIn ? <FarmerTransactions /> : <Homepage />}
              />
              <Route
                path="/admin-transactions"
                element={isLoggedIn ? <AdminTransactions /> : <Homepage />}
              />
              <Route
                path="/business-transactions"
                element={isLoggedIn ? <BusinessTransactions /> : <Homepage />}
              />
              <Route
                path="/add-to-cart"
                element={isLoggedIn ? <AddToCart /> : <Homepage />}
              />
              <Route
                path="/add-listing"
                element={isLoggedIn ? <AddListing /> : <Homepage />}
              />
              <Route
                path="/checkout"
                element={isLoggedIn ? <Checkout /> : <Homepage />}
              />
              <Route
                path="/farmer-marketplace"
                element={<FarmerMarketplace />}
              />
              <Route
                path="/business-marketplace"
                element={<BusinessMarketplace />}
              />
              <Route
                path="/admin-marketplace"
                element={<AdminMarketplace />}
              />
              <Route
                path="/stock-dashboard"
                element={isLoggedIn ? <FarmerStockDashboard /> : <Homepage />}
              />
              <Route path="/admin-guides" element={<AdminViewGuides />} />
              <Route path="/farmer-guides" element={<FarmerViewGuides />} />
              <Route
                path="/add-guide"
                element={isLoggedIn ? <AddGuide /> : <Homepage />}
              />
            </Routes>
          </div>
          <RenderFooter />
        </Router>
      </ProductProvider>
    </CartProvider>
  );
}

const MarketplaceSelector = ({ userRole }) => {
  const marketplaceMapping = {
    farmer: <FarmerMarketplace />,
    business: <BusinessMarketplace />,
    admin: <AdminMarketplace />,
  };

  return marketplaceMapping[userRole] || <Homepage />;
};

export default App;
