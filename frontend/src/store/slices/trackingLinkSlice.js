import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { trackingLinkAPI } from '../../api/trackingLinks';

export const fetchTrackingLinks = createAsyncThunk(
  'trackingLinks/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await trackingLinkAPI.getLinks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tracking links');
    }
  }
);

export const createTrackingLink = createAsyncThunk(
  'trackingLinks/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await trackingLinkAPI.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tracking link');
    }
  }
);

export const deleteTrackingLink = createAsyncThunk(
  'trackingLinks/delete',
  async (id, { rejectWithValue }) => {
    try {
      await trackingLinkAPI.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tracking link');
    }
  }
);

const trackingLinkSlice = createSlice({
  name: 'trackingLinks',
  initialState: {
    links: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackingLinks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTrackingLinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.links = action.payload.trackingLinks;
      })
      .addCase(fetchTrackingLinks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTrackingLink.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createTrackingLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.links.unshift(action.payload.trackingLink);
      })
      .addCase(createTrackingLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteTrackingLink.fulfilled, (state, action) => {
        state.links = state.links.filter((l) => l._id !== action.payload);
      });
  },
});

export const { clearError } = trackingLinkSlice.actions;
export default trackingLinkSlice.reducer;
