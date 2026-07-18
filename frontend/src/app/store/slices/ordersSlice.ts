import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI, CreateOrderPayload, ConfirmOrderPayload, ConfirmMomoPayload } from '../../api/orders';

interface OrdersState {
  orders: any[];
  currentOrder: any | null;
  clientSecret: string | null;
  tickets: any[];
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; totalPages: number; total: number };
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  clientSecret: null,
  tickets: [],
  isLoading: false,
  error: null,
  pagination: { currentPage: 1, totalPages: 1, total: 0 },
};

export const createOrder = createAsyncThunk('orders/createOrder', async (data: CreateOrderPayload, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.createOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create order');
  }
});

export const confirmOrder = createAsyncThunk('orders/confirmOrder', async (data: ConfirmOrderPayload, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.confirmOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to confirm order');
  }
});

export const confirmMomoOrder = createAsyncThunk('orders/confirmMomoOrder', async (data: ConfirmMomoPayload, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.confirmMomoOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'MoMo payment failed');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getMyOrders(params);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await ordersAPI.getOrderById(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearCurrentOrder: (state) => { state.currentOrder = null; state.clientSecret = null; state.tickets = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
        state.clientSecret = action.payload.clientSecret;
        // $0 orders return tickets immediately
        if (action.payload.tickets?.length > 0) {
          state.tickets = action.payload.tickets;
        }
      })
      .addCase(createOrder.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(confirmOrder.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(confirmOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
        state.tickets = action.payload.tickets;
        state.clientSecret = null;
      })
      .addCase(confirmOrder.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(confirmMomoOrder.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(confirmMomoOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
        state.tickets = action.payload.tickets;
        state.clientSecret = null;
      })
      .addCase(confirmMomoOrder.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchMyOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = { currentPage: action.payload.currentPage, totalPages: action.payload.totalPages, total: action.payload.total };
      })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload.order;
        state.tickets = action.payload.tickets;
      });
  },
});

export const { clearError, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
