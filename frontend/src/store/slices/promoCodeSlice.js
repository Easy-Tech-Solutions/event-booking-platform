import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { promoCodeAPI } from '../../api/promoCodes';

export const validatePromoCode = createAsyncThunk(
  'promoCode/validate',
  async ({ code, eventId, orderAmount }, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.validate({ code, eventId, orderAmount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid promo code');
    }
  }
);

export const fetchMyCodes = createAsyncThunk(
  'promoCode/fetchMyCodes',
  async (params, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.getMyCodes(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch promo codes');
    }
  }
);

export const createPromoCode = createAsyncThunk(
  'promoCode/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create promo code');
    }
  }
);

export const deletePromoCode = createAsyncThunk(
  'promoCode/delete',
  async (id, { rejectWithValue }) => {
    try {
      await promoCodeAPI.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete promo code');
    }
  }
);

export const togglePromoCode = createAsyncThunk(
  'promoCode/toggle',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await promoCodeAPI.update(id, { isActive });
      return response.data.promoCode;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update promo code');
    }
  }
);

const promoCodeSlice = createSlice({
  name: 'promoCode',
  initialState: {
    // checkout state
    appliedCode: null,       // { promoCodeId, code, discountType, discountValue, discountAmount }
    isValidating: false,
    validationError: null,
    // organizer management state
    codes: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAppliedCode: (state) => {
      state.appliedCode = null;
      state.validationError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.validationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // validate
      .addCase(validatePromoCode.pending, (state) => {
        state.isValidating = true;
        state.validationError = null;
      })
      .addCase(validatePromoCode.fulfilled, (state, action) => {
        state.isValidating = false;
        state.appliedCode = action.payload;
      })
      .addCase(validatePromoCode.rejected, (state, action) => {
        state.isValidating = false;
        state.appliedCode = null;
        state.validationError = action.payload;
      })
      // fetch
      .addCase(fetchMyCodes.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMyCodes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.codes = action.payload.promoCodes;
      })
      .addCase(fetchMyCodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createPromoCode.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createPromoCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.codes.unshift(action.payload.promoCode);
      })
      .addCase(createPromoCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // delete
      .addCase(deletePromoCode.fulfilled, (state, action) => {
        state.codes = state.codes.filter((c) => c._id !== action.payload);
      })
      // toggle
      .addCase(togglePromoCode.fulfilled, (state, action) => {
        const idx = state.codes.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.codes[idx] = action.payload;
      });
  },
});

export const { clearAppliedCode, clearError } = promoCodeSlice.actions;
export default promoCodeSlice.reducer;
