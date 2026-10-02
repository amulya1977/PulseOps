import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function Protected({children}) { return localStorage.getItem('pulseops_token') ? children : <Navigate to="/login" replace/>; }
function Shell({children}) { return <Protected><Layout>{children}</Layout></Protected>; }
export default function App(){
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/" element={<Shell><Dashboard/></Shell>}/>
    <Route path="/services" element={<Shell><Services/></Shell>}/>
    <Route path="/services/:id" element={<Shell><ServiceDetails/></Shell>}/>
    <Route path="/incidents" element={<Shell><Incidents/></Shell>}/>
    <Route path="/alerts" element={<Shell><Alerts/></Shell>}/>
    <Route path="/settings" element={<Shell><Settings/></Shell>}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes>
}
