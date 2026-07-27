'use client';

import { useState } from 'react';
import Questionnaire from '@/components/career-simulator/Questionnaire';
import Results from '@/components/career-simulator/Results';
import { UserResponse, RecommendationResponse } from '@/types/career-simulator';
import { careerAPI } from '@/lib/career-api';
import { PageHeader, Btn, Card } from '@/components/primitives';
import { C } from '@/lib/tokens';

export default function CareerSimulatorPage() {
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (userResponse: UserResponse) => {
    setLoading(true);
    setError(null);
    
    try {
      try {
        await careerAPI.healthCheck();
      } catch (healthError) {
        setError('Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000');
        setLoading(false);
        return;
      }
      
      const result = await careerAPI.getRecommendations(userResponse);
      setRecommendations(result);
      setUserResponse(userResponse);
      setShowResults(true);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.detail || 'Failed to get recommendations. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setRecommendations(null);
    setUserResponse(null);
    setError(null);
  };

  if (showResults && recommendations) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <Btn kind="subtle" iconL="chev" onClick={handleReset}>Take Questionnaire Again</Btn>
        </div>
        <Results recommendations={recommendations} userAge={userResponse?.age} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', padding: '40px 20px' }}>
      <PageHeader 
        title="Career Simulator AI" 
        subtitle="Get personalized career recommendations powered by AI. Answer a few questions to discover your ideal career path."
        marathi="करिअर सिम्युलेटर"
        eyebrow="AI-Powered"
      />

      <div style={{ marginTop: 40 }}>
        {error && (
          <Card pad={16} style={{ marginBottom: 24, background: C.brick + '15', borderColor: C.brick + '40' }}>
            <div style={{ color: C.brick, fontWeight: 600, fontSize: 14 }}>{error}</div>
            <div style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>Make sure the backend server is running.</div>
          </Card>
        )}

        {loading ? (
          <Card pad={48} style={{ textAlign: 'center' }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: '50%', border: `3px solid ${C.lineMid}`, 
              borderTopColor: C.saffron, animation: 'spin 1s linear infinite', margin: '0 auto' 
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: C.ink }}>Generating your personalized recommendations...</div>
            <div style={{ marginTop: 8, fontSize: 14, color: C.ink3 }}>This may take a few moments.</div>
          </Card>
        ) : (
          <Questionnaire onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
