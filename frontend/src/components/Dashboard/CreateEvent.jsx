import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createEvent } from '../../store/slices/eventSlice';
import { categoryAPI } from '../../api/categories';

const CreateEvent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const isOnline = watch('isOnline');
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getCategories();
        setCategories(response.data.categories || []);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data) => {
    try {
      // Convert form data to proper format
      const eventData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        capacity: parseInt(data.capacity),
        isOnline: data.isOnline || false,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
      };

      if (!data.isOnline) {
        eventData.location = {
          venue: data.venue,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country || 'US'
        };
      }

      await dispatch(createEvent(eventData)).unwrap();
      toast.success('Event created successfully!');
      navigate('/dashboard/events');
    } catch (error) {
      toast.error(error || 'Failed to create event');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600">Fill in the details to create your event.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                {...register('title', { required: 'Event title is required' })}
                type="text"
                className="input"
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input"
                placeholder="Describe your event"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="datetime-local"
                  className="input"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <input
                  {...register('endDate', { required: 'End date is required' })}
                  type="datetime-local"
                  className="input"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity *
              </label>
              <input
                {...register('capacity', { 
                  required: 'Capacity is required',
                  min: { value: 1, message: 'Capacity must be at least 1' }
                })}
                type="number"
                min="1"
                className="input"
                placeholder="Maximum number of attendees"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                {...register('tags')}
                type="text"
                className="input"
                placeholder="Enter tags separated by commas (e.g., music, concert, live)"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                {...register('isOnline')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                This is an online event
              </label>
            </div>

            {!isOnline && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name
                  </label>
                  <input
                    {...register('venue')}
                    type="text"
                    className="input"
                    placeholder="Enter venue name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    className="input"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      className="input"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      className="input"
                      placeholder="State"
                    />
                  </div>
                </div>
              </>
            )}

            {isOnline && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Event Link
                </label>
                <input
                  {...register('onlineLink')}
                  type="url"
                  className="input"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recurring Schedule</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Is this a recurring event?</label>
              <input {...register('isRecurring')} type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
            </div>
            {watch('isRecurring') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select {...register('recurrenceFrequency')} className="input">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                  <input {...register('recurrenceInterval', { min: 1 })} type="number" min="1" className="input" placeholder="Every X weeks/months" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input {...register('recurrenceEndDate')} type="date" className="input" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/events')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;