import { UserResponse, RecommendationResponse } from '@/types/career-simulator';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const careerAPI = {
  /**
   * Get career recommendations based on user responses
   */
  getRecommendations: async (userResponse: UserResponse): Promise<RecommendationResponse> => {
    console.log('📤 Sending request to backend:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userResponse),
      });

      if (!response.ok) {
        let errorMsg = 'Unknown server error';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(`Server error: ${errorMsg}`);
      }

      console.log('✅ Received response from backend');
      return await response.json();
    } catch (error: any) {
      console.error('❌ API Error:', error);
      throw new Error(error.message || 'Failed to get recommendations');
    }
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return response.json();
  },
};
