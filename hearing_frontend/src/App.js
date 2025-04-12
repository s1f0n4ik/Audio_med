import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AudioTester from './AudioTester';
import PatientTests from './PatientTests';
import TestResult from './TestResult';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AudioTester />} />
          <Route path="/tests" element={<PatientTests />} />
          <Route path="/results/:testId" element={<TestResult />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;