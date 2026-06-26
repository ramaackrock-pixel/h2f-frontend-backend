import { apiService } from './apiService';

export const billingService = {
  getAll: async () => {
    const response = await apiService.get('/billing');
    return response.invoices || [];
  },

  create: async (invoiceData: any) => {
    const response = await apiService.post('/billing', invoiceData);
    return response.billing || response.invoice;
  },

  update: async (id: string, invoiceData: any) => {
    const response = await apiService.patch(`/billing/${id}`, invoiceData);
    return response.invoice;
  },

  delete: async (id: string) => {
    await apiService.delete(`/billing/${id}`);
  }
};
