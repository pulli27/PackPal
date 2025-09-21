import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";

import AboutPage from './Components/AboutPage/AboutPage';
import HandBag from './Components/HandBag/HandBag';

import Home from "./Components/Home/Home";
import Accessories from "./Components/Accessories/Accessories";
import Header from './Components/Header/Header';
import Clutches from './Components/Clutches/Clutches';
import KidsBag from './Components/KidsBag/KidsBag';
import Footer from './Components/Footer/Footer';
import SizeGuide from './Components/SizeGuide/SizeGuide';
import Sales from './Components/Sales/Sales';
import Faq from './Components/Faq/Faq';


export default function App() {
  return (
    <Routes>
      {/* default -> dashboard */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* main pages */}
      <Route path="/home" element={<Home />} />
      <Route path="/handbag" element={<HandBag />} />
      <Route path="/aboutpage" element={<AboutPage />} />
      <Route path="/accessories" element={<Accessories />} />
      <Route path="/header" element={<Header />} />
      <Route path="/clutches" element={<Clutches />} />
      <Route path="/kidsbag" element={<KidsBag />} />
      <Route path="/footer" element={<Footer />} />
      <Route path="/sizeguide" element={<SizeGuide />} />
      <Route path="/sale" element={<Sales />} />
      <Route path="/faq" element={<Faq />} />
</Routes>

  );
}
