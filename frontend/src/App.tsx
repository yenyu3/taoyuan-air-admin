import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DataSources from './pages/DataSources';
import Stations from './pages/Stations';
import Users from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F2E9' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: 220,
          padding: '32px 32px 32px 32px',
          minHeight: '100vh',
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
