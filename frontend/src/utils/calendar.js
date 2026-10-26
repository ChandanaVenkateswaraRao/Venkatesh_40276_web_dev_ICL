// Utility to generate and download standard iCalendar (.ics) files for Apple/Google/Outlook calendar
export const downloadIcsCalendar = ({ title, theater, time, seats, bookingId }) => {
  try {
    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const cleanTitle = (title || 'Movie').replace(/[\\;,]/g, ' ');
    const cleanTheater = (theater || 'Multiplex Cinema').replace(/[\\;,]/g, ' ');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//bookmyshow//Movie Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:booking-${bookingId || Date.now()}@bookmyshow.com`,
      `DTSTAMP:${dtStamp}`,
      `SUMMARY:🎬 Movie: ${cleanTitle}`,
      `DESCRIPTION:Your booking for ${cleanTitle} at ${cleanTheater}. Seats: ${seats?.join(', ') || 'N/A'}. Booking ID: ${bookingId}.`,
      `LOCATION:${cleanTheater}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Your movie starts soon!',
      'TRIGGER:-PT1H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cleanTitle.toLowerCase().replace(/\s+/g, '_')}_ticket.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to generate calendar invite:', err);
  }
};
