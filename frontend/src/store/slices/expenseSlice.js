import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async ({ page = 1, search = '', category = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/expenses?page=${page}&search=${search}&category=${category}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const fetchExpense = createAsyncThunk(
  'expense/fetchExpense',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense');
    }
  }
);

export const createExpense = createAsyncThunk(
  'expense/createExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/expenses`, expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expense/updateExpense',
  async ({ id, expenseData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${backendUrl}/api/expenses/${id}`, expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expense/deleteExpense',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${backendUrl}/api/expenses/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
    }
  }
);

export const addReceipts = createAsyncThunk(
  'expense/addReceipts',
  async ({ id, receipts }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      receipts.forEach((receipt) => {
        formData.append('receipts', receipt);
      });
      const response = await axios.post(`${backendUrl}/api/expenses/${id}/receipts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add receipts');
    }
  }
);

export const deleteReceipt = createAsyncThunk(
  'expense/deleteReceipt',
  async ({ expenseId, receiptId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${backendUrl}/api/expenses/${expenseId}/receipts/${receiptId}`);
      return { expenseId, receiptId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete receipt');
    }
  }
);

const initialState = {
  expenses: [],
  currentExpense: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

const expenseSlice = createSlice({
  name: 'expense',
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
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.expenses;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Expense
      .addCase(fetchExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExpense = action.payload;
      })
      .addCase(fetchExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.expenses.findIndex((expense) => expense.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense?.id === action.payload.id) {
          state.currentExpense = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Expense
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
        if (state.currentExpense?.id === action.payload) {
          state.currentExpense = null;
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Receipts
      .addCase(addReceipts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReceipts.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.expenses.findIndex((expense) => expense.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense?.id === action.payload.id) {
          state.currentExpense = action.payload;
        }
      })
      .addCase(addReceipts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Receipt
      .addCase(deleteReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.loading = false;
        const { expenseId, receiptId } = action.payload;
        const expense = state.expenses.find((e) => e.id === expenseId);
        if (expense) {
          expense.receipts = expense.receipts.filter((receipt) => receipt.id !== receiptId);
        }
        if (state.currentExpense?.id === expenseId) {
          state.currentExpense.receipts = state.currentExpense.receipts.filter(
            (receipt) => receipt.id !== receiptId
          );
        }
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentPage } = expenseSlice.actions;
export default expenseSlice.reducer; 