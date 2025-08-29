import React from "react";
import { Route, Routes} from "react-router";
import './App.css';
import InventoryDashboard from './Components/Dashboard/InventoryDashboard';
import ItemInventory from './Components/ItemInventory/ItemInventory';

function App() {
  return (
    <div>
   
   <React.Fragment>
    <Routes>
      
      <Route path="/maindashboard" element={<InventoryDashboard/>}/>
      <Route path="/iteminventory" element={<ItemInventory/>}/>
    
    </Routes>
   </React.Fragment>
    </div>
  );
}

export default App;
