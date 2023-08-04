import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Header } from "./Components/Header/Header";
import { Home } from "./Components/Home/Home";
import { Login } from "./Components/Login/Login";
import { Register } from "./Components/Register/Register";
import { Create } from "./Components/Create/Create";
import { Edit } from "./Components/Edit/Edit";
import { AllProducts } from "./Components/AllListsOfPublications/AllProducts";
import { Details } from "./Components/Details/Details";
import { Footer } from "./Components/Footer/Footer";
import { AuthComponent } from "./contexts/userContext";


function App() {
  return (
    <AuthComponent>
    <>
 <Header />
    <main id="site-content">
<Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="/catalog" element= {<AllProducts/>}/>
  <Route path="/create" element={<Create/>}/>
  <Route path="/edit/:carid" element={<Edit/>}/>
  <Route path="/details/:carId" element={<Details/>} />
</Routes>

    </main>
    <Footer />
    </>
    </AuthComponent>
  );
};

export default App;
