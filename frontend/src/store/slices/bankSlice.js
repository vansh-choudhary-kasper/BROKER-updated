import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchBanks = createAsyncThunk(
  'bank/fetchBanks',
  async ({ page = 1, search = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/banks?page=${page}&search=${search}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch banks');
    }
  }
);

export const fetchBank = createAsyncThunk(
  'bank/fetchBank',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/banks/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank');
    }
  }
);

export const createBank = createAsyncThunk(
  'bank/createBank',
  async (bankData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/banks`, bankData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bank');
    }
  }
);

export const updateBank = createAsyncThunk(
  'bank/updateBank',
  async ({ id, bankData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${backendUrl}/api/banks/${id}`, bankData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bank');
    }
  }
);

export const deleteBank = createAsyncThunk(
  'bank/deleteBank',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${backendUrl}/api/banks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete bank');
    }
  }
);

export const addDocuments = createAsyncThunk(
  'bank/addDocuments',
  async ({ id, documents }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      documents.forEach((doc) => {
        formData.append('documents', doc);
      });
      const response = await axios.post(`${backendUrl}/api/banks/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add documents');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'bank/deleteDocument',
  async ({ bankId, documentId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${backendUrl}/api/banks/${bankId}/documents/${documentId}`);
      return { bankId, documentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  }
);

const initialState = {
  banks: [],
  currentBank: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

const bankSlice = createSlice({
  name: 'bank',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Banks
      .addCase(fetchBanks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanks.fulfilled, (state, action) => {
        state.loading = false;
        state.banks = action.payload.banks;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchBanks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Bank
      .addCase(fetchBank.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBank.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBank = action.payload;
      })
      .addCase(fetchBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Bank
      .addCase(createBank.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBank.fulfilled, (state, action) => {
        state.loading = false;
        state.banks.push(action.payload);
      })
      .addCase(createBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Bank
      .addCase(updateBank.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBank.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.banks.findIndex((bank) => bank.id === action.payload.id);
        if (index !== -1) {
          state.banks[index] = action.payload;
        }
        if (state.currentBank?.id === action.payload.id) {
          state.currentBank = action.payload;
        }
      })
      .addCase(updateBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Bank
      .addCase(deleteBank.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBank.fulfilled, (state, action) => {
        state.loading = false;
        state.banks = state.banks.filter((bank) => bank.id !== action.payload);
        if (state.currentBank?.id === action.payload) {
          state.currentBank = null;
        }
      })
      .addCase(deleteBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Documents
      .addCase(addDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDocuments.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.banks.findIndex((bank) => bank.id === action.payload.id);
        if (index !== -1) {
          state.banks[index] = action.payload;
        }
        if (state.currentBank?.id === action.payload.id) {
          state.currentBank = action.payload;
        }
      })
      .addCase(addDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        const { bankId, documentId } = action.payload;
        const bank = state.banks.find((b) => b.id === bankId);
        if (bank) {
          bank.documents = bank.documents.filter((doc) => doc.id !== documentId);
        }
        if (state.currentBank?.id === bankId) {
          state.currentBank.documents = state.currentBank.documents.filter(
            (doc) => doc.id !== documentId
          );
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentPage } = bankSlice.actions;
export default bankSlice.reducer; 