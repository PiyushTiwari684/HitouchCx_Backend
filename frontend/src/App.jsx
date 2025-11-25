import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import SystemCheckPage from './features/systemCheck/SystemCheckPage.jsx'
import ProtectedRoute from './features/auth/ProtectectedRoute'
import InstructionPage from './features/instruction/InstructionPage.jsx'
import WebcamAudioPage from './features/systemCheck/WebCamAudioPage.jsx'
import AssessmentPage from './features/assessment/AssessmentPage.jsx'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        {/* Page 1: Instruction Page - Default route after login */}
        <Route path="/instructions" element={<InstructionPage />} />

        {/* Page 2: System Check (Permissions) - Takes attemptId */}
        <Route path="/system-check/:attemptId" element={<SystemCheckPage />} />

        {/* Page 3: Device Test (Camera/Audio/Network) - Takes attemptId and systemCheckId */}
        <Route path="/device-test/:attemptId/:systemCheckId" element={<WebcamAudioPage />} />

        <Route path="/identity-check" element={<WebcamAudioPage />} />

        {/* Page 4: Assessment - Takes assessmentId and attemptId */}
        <Route path="/assessment/:assessmentId/:attemptId" element={<AssessmentPage/>} />

      </Route>
       
      <Route path="/" element={<InstructionPage />} />
    </Routes>
  )
}

export default App;