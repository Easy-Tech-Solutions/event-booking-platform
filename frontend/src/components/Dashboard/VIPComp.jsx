import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Star, UserPlus, Loader, CheckCircle, Clock } from 'lucide-react';
import { vipAPI } from '../../api/vip';
import { eventAPI } from '../../api/events';

const VIPComp = () => {
  const [events, setEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [vipList, setVipList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVip, setIsLoadingVip] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { isVip: false },
  });
  const formEventId = watch('eventId');

  useEffect(() => {
    eventAPI.getMyEvents?.()
      .then((r) => setEvents(r.data.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formEventId) { setTicketTypes([]); return; }
    eventAPI.getTicketTypes?.(formEventId)
      .then((r) => setTicketTypes(r.data.ticketTypes || []))
      .catch(() => {});
  }, [formEventId]);

  const loadVipList = async (eventId) => {
    if (!eventId) return;
    setSelectedEvent(eventId);
    setIsLoadingVip(true);
    try {
      const res = await vipAPI.getVipAttendees(eventId);
      setVipList(res.data.vipAttendees || []);
    } catch {
      toast.error('Failed to load VIP list.');
    } finally {
      setIsLoadingVip(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await vipAPI.issueComp({
        eventId: data.eventId,
        ticketTypeId: data.ticketTypeId,
        recipientEmail: data.recipientEmail,
        isVip: data.isVip,
        note: data.note || undefined,
      });
      toast.success('Complimentary ticket issued successfully.');
      reset();
      setShowForm(false);
      if (selectedEvent === data.eventId) await loadVipList(data.eventId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VIP &amp; Comp Tickets</h1>
          <p className="text-gray-600 text-sm mt-0.5">Issue complimentary passes and manage VIP attendees.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Issue Comp
        </button>
      </div>

      {/* Issue comp form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Complimentary Ticket</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event *</label>
                <select {...register('eventId', { required: 'Event is required' })} className="input">
                  <option value="">Select event</option>
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
                {errors.eventId && <p className="text-xs text-red-600 mt-1">{errors.eventId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type *</label>
                <select {...register('ticketTypeId', { required: 'Ticket type is required' })} className="input" disabled={!formEventId}>
                  <option value="">Select ticket type</option>
                  {ticketTypes.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                {errors.ticketTypeId && <p className="text-xs text-red-600 mt-1">{errors.ticketTypeId.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email *</label>
                <input
                  {...register('recipientEmail', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  type="email"
                  className="input"
                  placeholder="attendee@example.com"
                />
                {errors.recipientEmail && <p className="text-xs text-red-600 mt-1">{errors.recipientEmail.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (sent to recipient)</label>
                <textarea {...register('note')} rows={2} className="input" placeholder="Personal message to include in the ticket email…" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('isVip')}
                  type="checkbox"
                  id="isVip"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isVip" className="text-sm text-gray-700">Mark as VIP</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                Issue Ticket
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* VIP list viewer */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">View VIP Attendees</h2>
        <div className="flex gap-3 mb-4">
          <select
            value={selectedEvent}
            onChange={(e) => loadVipList(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">Select an event</option>
            {events.map((e) => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>
        </div>

        {isLoadingVip ? (
          <div className="flex justify-center py-8"><Loader className="h-5 w-5 animate-spin text-blue-500" /></div>
        ) : selectedEvent && vipList.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No VIP or comp attendees for this event.</p>
          </div>
        ) : vipList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pr-4 font-medium">Attendee</th>
                  <th className="pb-3 pr-4 font-medium">Ticket</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vipList.map((attendee) => (
                  <tr key={attendee.ticketNumber} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">
                        {attendee.holder?.firstName} {attendee.holder?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{attendee.holder?.email}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-600">{attendee.ticketNumber}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1">
                        {attendee.isVip && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                            <Star className="h-3 w-3" /> VIP
                          </span>
                        )}
                        {attendee.isComp && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">Comp</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${attendee.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {attendee.status === 'used'
                          ? <><CheckCircle className="h-3 w-3" /> Checked in</>
                          : <><Clock className="h-3 w-3" /> Active</>}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {attendee.checkInTime ? new Date(attendee.checkInTime).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VIPComp;
