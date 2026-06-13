import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Copy, Link, Loader, TrendingUp } from 'lucide-react';
import {
  fetchTrackingLinks,
  createTrackingLink,
  deleteTrackingLink,
} from '../../store/slices/trackingLinkSlice';
import { eventAPI } from '../../api/events';

const TrackingLinks = () => {
  const dispatch = useDispatch();
  const { links, isLoading, error } = useSelector((s) => s.trackingLinks);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchTrackingLinks());
    // Load organizer's events for the event selector
    eventAPI.getMyEvents?.()
      .then((r) => setEvents(r.data.events || []))
      .catch(() => {});
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(createTrackingLink({
        eventId: data.eventId,
        label: data.label,
        utmSource: data.utmSource || undefined,
        utmMedium: data.utmMedium || undefined,
        utmCampaign: data.utmCampaign || undefined,
      })).unwrap();
      toast.success('Tracking link created.');
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(err || 'Failed to create tracking link.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tracking link?')) return;
    try {
      await dispatch(deleteTrackingLink(id)).unwrap();
      toast.success('Tracking link deleted.');
    } catch (err) {
      toast.error(err || 'Failed to delete.');
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => toast.success('URL copied to clipboard.'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Links</h1>
          <p className="text-gray-600 text-sm mt-0.5">Track sales attribution by campaign, source, or channel.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Link
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Tracking Link</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event *</label>
                <select {...register('eventId', { required: 'Event is required' })} className="input">
                  <option value="">Select an event</option>
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
                {errors.eventId && <p className="text-xs text-red-600 mt-1">{errors.eventId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  {...register('label', { required: 'Label is required' })}
                  className="input"
                  placeholder="e.g. Instagram Bio, Facebook Ad"
                />
                {errors.label && <p className="text-xs text-red-600 mt-1">{errors.label.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Source</label>
                <input {...register('utmSource')} className="input" placeholder="facebook" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Medium</label>
                <input {...register('utmMedium')} className="input" placeholder="social" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Campaign</label>
                <input {...register('utmCampaign')} className="input" placeholder="summer-launch" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                Create Link
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Links list */}
      {isLoading && links.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : links.length === 0 ? (
        <div className="card text-center py-12">
          <Link className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tracking links yet. Create one to start measuring attribution.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <div key={link._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{link.label}</h3>
                    {link.event?.title && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {link.event.title}
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-700 truncate max-w-xs md:max-w-md">
                      {link.url}
                    </code>
                    <button
                      onClick={() => copyUrl(link.url)}
                      className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  {/* UTM params */}
                  {(link.utmSource || link.utmMedium || link.utmCampaign) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {link.utmSource && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">source: {link.utmSource}</span>}
                      {link.utmMedium && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">medium: {link.utmMedium}</span>}
                      {link.utmCampaign && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">campaign: {link.utmCampaign}</span>}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right space-y-0.5">
                  <div className="flex items-center gap-1 justify-end text-sm text-gray-700">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                    <span><strong>{link.clicks}</strong> clicks</span>
                  </div>
                  <p className="text-sm text-gray-700"><strong>{link.orders}</strong> orders</p>
                  <p className="text-sm text-green-700 font-medium">${(link.revenue || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(link._id)}
                  className="text-sm text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingLinks;
