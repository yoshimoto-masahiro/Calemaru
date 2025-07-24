import { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, CalendarSource, CalendarDay } from '../types/calendar';
import { mockEvents, calendarSources } from '../data/mockData';

export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [sources, setSources] = useState<CalendarSource[]>(calendarSources);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredEvents = useMemo(() => {
    const enabledSources = sources.filter(source => source.enabled).map(s => s.id);
    return events.filter(event => enabledSources.includes(event.source.id));
  }, [events, sources]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
      });
    }
    
    return days;
  }, [currentDate, filteredEvents]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const toggleSourceEnabled = (sourceId: string) => {
    setSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { ...source, enabled: !source.enabled }
          : source
      )
    );
  };

  const createEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (eventId: string, eventData: Partial<CalendarEvent>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData }
          : event
      )
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const importEvents = (newEvents: CalendarEvent[]) => {
    setEvents(prev => [...prev, ...newEvents]);
  };

  const openEventModal = (event: CalendarEvent | null, creating = false) => {
    setSelectedEvent(event);
    setIsCreating(creating);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsCreating(false);
    setIsEventModalOpen(false);
  };

  return {
    currentDate,
    calendarDays,
    sources,
    events: filteredEvents,
    selectedEvent,
    isEventModalOpen,
    isCreating,
    navigateMonth,
    toggleSourceEnabled,
    createEvent,
    updateEvent,
    deleteEvent,
    importEvents,
    openEventModal,
    closeEventModal,
  };
};