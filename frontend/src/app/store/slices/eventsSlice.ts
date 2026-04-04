import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventsAPI, EventsParams, CreateEventPayload } from '../../api/events';

interface EventsState {
  events: any[];
  currentEvent: any | null;
  ticketTypes: any[];
  myEvents: any[];
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; totalPages: number; total: number };
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  ticketTypes: [],
  myEvents: [],
  isLoading: false,
  error: null,
  pagination: { currentPage: 1, totalPages: 1, total: 0 },
};

export const fetchEvents = createAsyncThunk('events/fetchEvents', async (params: EventsParams | undefined, { rejectWithValue }) => {
  try {
    const response = await eventsAPI.getEvents(params);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchEventById = createAsyncThunk('events/fetchEventById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await eventsAPI.getEventById(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
  }
});

export const fetchMyEvents = createAsyncThunk('events/fetchMyEvents', async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
  try {
    const response = await eventsAPI.getMyEvents(params);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch your events');
  }
});

export const createEvent = createAsyncThunk('events/createEvent', async (data: CreateEventPayload, { rejectWithValue }) => {
  try {
    const response = await eventsAPI.createEvent(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create event');
  }
});

export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, data }: { id: string; data: Partial<CreateEventPayload> }, { rejectWithValue }) => {
  try {
    const response = await eventsAPI.updateEvent(id, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update event');
  }
});

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id: string, { rejectWithValue }) => {
  try {
    await eventsAPI.deleteEvent(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
  }
});

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearCurrentEvent: (state) => { state.currentEvent = null; state.ticketTypes = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events;
        state.pagination = { currentPage: action.payload.currentPage, totalPages: action.payload.totalPages, total: action.payload.total };
      })
      .addCase(fetchEvents.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchEventById.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload.event;
        state.ticketTypes = action.payload.ticketTypes;
      })
      .addCase(fetchEventById.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchMyEvents.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myEvents = action.payload.events;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.myEvents.unshift(action.payload.event);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const updated = action.payload.event;
        state.myEvents = state.myEvents.map((e) => e._id === updated._id ? updated : e);
        if (state.currentEvent?._id === updated._id) state.currentEvent = updated;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.myEvents = state.myEvents.filter((e) => e._id !== action.payload);
      });
  },
});

export const { clearError, clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
