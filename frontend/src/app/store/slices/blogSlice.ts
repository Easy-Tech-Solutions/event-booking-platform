import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

interface BlogState {
  posts: any[];
  currentPost: any | null;
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; totalPages: number; total: number };
}

const initialState: BlogState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  pagination: { currentPage: 1, totalPages: 1, total: 0 },
};

export const fetchBlogPosts = createAsyncThunk('blog/fetchPosts', async (params: { page?: number; category?: string; search?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/blog', { params });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch blog posts');
  }
});

export const fetchBlogPostBySlug = createAsyncThunk('blog/fetchBySlug', async (slug: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/blog/${slug}`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Post not found');
  }
});

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    clearCurrentPost: (state) => { state.currentPost = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogPosts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.posts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchBlogPostBySlug.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchBlogPostBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload.post;
      })
      .addCase(fetchBlogPostBySlug.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
  },
});

export const { clearCurrentPost } = blogSlice.actions;
export default blogSlice.reducer;
