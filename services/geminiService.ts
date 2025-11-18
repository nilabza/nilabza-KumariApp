import { UserProfile } from '../types';

const API_BASE_URL = ''; // Relative path to use the same origin, assumes backend is served on the same host

export const detectLanguage = async (text: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/detect-language/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            console.error("Backend language detection failed:", await response.text());
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.languageCode || 'en-IN';
    } catch (error) {
        console.error("Error calling backend for language detection:", error);
        return 'en-IN';
    }
};

export const getChatbotResponse = async (query: string, userProfile: UserProfile, langCode: string, isWorkerMode: boolean): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                userProfile,
                langCode,
                isWorkerMode
            }),
        });

        if (!response.ok) {
            console.error("Backend chat failed:", await response.text());
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.responseText;
    } catch (error) {
        console.error("Error fetching response from backend API:", error);
        return "I'm having a little trouble connecting to my brain right now. Please try asking me again in a moment.";
    }
};
