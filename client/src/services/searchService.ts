import api from './api';

export const searchService = {
    aiSearch: async (query: string) => {
        const response = await api.post('/api/search/ai', { query });
        return response.data;
    },

    normalSearch: async (city: string) => {
        const response = await api.get(`/api/search/${city}`);
        return response.data;
    }
};
