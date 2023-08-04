import { Route, Routes } from "react-router-dom";
import './App.css';
import { Header } from "./Components/Header/Header";
import { Bags } from './Components/Bags/Bags';
import { Shoes } from './Components/Shoes/Shoes';
import { Products } from './Components/Watches/Watches';
import { Footer } from "./Components/Foooter/Footer";
import { Watches } from "./Components/Watches/Watches";


function App() {
  return (
    <>
    <Header/>
   
    <Routes>
      <Route path="/bags" element={<Bags/>}/>
      <Route path="/shoes" element={<Shoes/>}/>
      <Route path="/watches" element={<Watches/>}/>
    </Routes>
   
   
    <Footer/>
    </>
  );
}

export default App;
