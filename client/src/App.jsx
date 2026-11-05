import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import layout and pages from their respective files
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage' 
import HomePage from './pages/HomePage';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <main>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="sign_in" element={<SignInPage/>} />
          <Route path="home" element={<HomePage/>} />

        
        <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
    </main>
  );
}
export default App
