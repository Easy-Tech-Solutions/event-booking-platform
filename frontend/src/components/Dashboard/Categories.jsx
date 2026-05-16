import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { categoryAPI } from '../../api/categories';

const Categories = () => {
  const { user } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2563eb'
  });

  const canManage = user?.role === 'organizer' || user?.role === 'admin';

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      setIsSaving(true);
      await categoryAPI.createCategory(formData);
      setFormData({ name: '', description: '', color: '#2563eb' });
      toast.success('Category created');
      await loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    if (!canManage) return;

    try {
      await categoryAPI.updateCategory(category._id, { isActive: !category.isActive });
      toast.success('Category updated');
      await loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600">Manage event categories for organizers and attendees.</p>
      </div>

      {canManage && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              className="input"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              type="text"
              className="input"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              type="color"
              className="input h-10"
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-600">No categories available.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                <div className="flex items-center space-x-3">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#2563eb' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => toggleStatus(category)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {category.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
