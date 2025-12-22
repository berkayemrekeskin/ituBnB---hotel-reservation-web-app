import api from './api';

export const searchService = {
    aiSearch: async (query: string) => {
        const response = await api.post('/api/search/', { query });
        return response.data;
    },
};
