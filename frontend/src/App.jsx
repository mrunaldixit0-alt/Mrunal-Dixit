import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RestaurantProvider } from './context/RestaurantContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import FoodDetailModal from './components/FoodDetailModal';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookTable from './pages/BookTable';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import FoodManager from './pages/admin/FoodManager';
import CategoryManager from './pages/admin/CategoryManager';
import OrderManager from './pages/admin/OrderManager';
import CustomerManager from './pages/admin/CustomerManager';
import BookingManager from './pages/admin/BookingManager';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

function CustomerLayout({ onViewFoodDetails }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Chatbot onViewFoodDetails={onViewFoodDetails} />
    </div>
  );
}

export default function App() {
  const [selectedFoodDetail, setSelectedFoodDetail] = useState(null);

  const handleViewFoodDetails = (food) => {
    setSelectedFoodDetail(food);
  };

  return (
    <AuthProvider>
      <RestaurantProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>

              {/* Customer Panel Routes */}
              <Route path="/" element={<CustomerLayout onViewFoodDetails={handleViewFoodDetails} />}>
                <Route index element={<Home onViewFoodDetails={handleViewFoodDetails} />} />
                <Route path="menu" element={<Menu onViewFoodDetails={handleViewFoodDetails} />} />
                <Route path="book-table" element={<BookTable />} />
                <Route path="cart" element={<Cart />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="orders" element={<Orders />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Admin Panel Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<BookingManager />} />
                <Route path="foods" element={<FoodManager />} />
                <Route path="categories" element={<CategoryManager />} />
                <Route path="orders" element={<OrderManager />} />
                <Route path="customers" element={<CustomerManager />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

            </Routes>

            {/* Global Food Detail Modal */}
            {selectedFoodDetail && (
              <FoodDetailModal
                food={selectedFoodDetail}
                onClose={() => setSelectedFoodDetail(null)}
              />
            )}

          </BrowserRouter>
        </CartProvider>
      </RestaurantProvider>
    </AuthProvider>
  );
}
