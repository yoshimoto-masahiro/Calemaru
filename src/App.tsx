import React, { useState } from 'react';
import { useCalendar } from './hooks/useCalendar';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarFilters } from './components/CalendarFilters';
import { CalendarGrid } from './components/CalendarGrid';
import { EventModal } from './components/EventModal';
import { FileDropZone } from './components/FileDropZone';

function App() {
  const {
    currentDate,
    calendarDays,
    sources,
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
  } = useCalendar();

  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    openEventModal(null, true);
  };

  const handleEventClick = (event: any) => {
    openEventModal(event, false);
  };

  const handleCreateEvent = () => {
    setSelectedDate(new Date());
    openEventModal(null, true);
  };

  const handleImportFiles = () => {
    setShowImport(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <CalendarHeader
          currentDate={currentDate}
          onNavigate={navigateMonth}
          onCreateEvent={handleCreateEvent}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onImportFiles={handleImportFiles}
        />

        <CalendarFilters
          sources={sources}
          onToggleSource={toggleSourceEnabled}
          isOpen={showFilters}
        />

        <CalendarGrid
          calendarDays={calendarDays}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
        />

        <EventModal
          isOpen={isEventModalOpen}
          event={selectedEvent}
          sources={sources}
          isCreating={isCreating}
          selectedDate={selectedDate}
          onClose={closeEventModal}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />

        <FileDropZone
          sources={sources}
          onImport={importEvents}
          isOpen={showImport}
          onClose={() => setShowImport(false)}
        />
      </div>
    </div>
  );
}

export default App;