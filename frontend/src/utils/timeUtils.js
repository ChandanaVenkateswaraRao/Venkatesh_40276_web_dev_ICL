/**
 * Utility functions for parsing and checking showtime dates, expiration,
 * and 2-hour ticket cancellation eligibility.
 */

export const parseShowtimeDateTime = (dateInput, timeStr) => {
  if (!dateInput || !timeStr) return null;

  let year, month, day;
  if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    month = dateInput.getMonth();
    day = dateInput.getDate();
  } else if (typeof dateInput === 'string') {
    const datePart = dateInput.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }
  } else {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  const dt = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
};

/**
 * Check if a showtime's scheduled start time has already passed.
 */
export const isShowtimeExpired = (dateInput, timeStr) => {
  const dt = parseShowtimeDateTime(dateInput, timeStr);
  if (!dt) return false;
  return dt.getTime() <= Date.now();
};

/**
 * Check if a booking is eligible for cancellation.
 * Policy: Tickets can ONLY be cancelled strictly at least 2 hours prior to showtime.
 */
export const getCancellationEligibility = (dateInput, timeStr) => {
  const dt = parseShowtimeDateTime(dateInput, timeStr);
  if (!dt) {
    return {
      isEligible: false,
      hoursRemaining: 0,
      reason: 'Showtime schedule not available'
    };
  }

  const now = Date.now();
  const diffMs = dt.getTime() - now;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (diffMs <= 0) {
    return {
      isEligible: false,
      hoursRemaining: 0,
      reason: 'Show has already started or ended'
    };
  }

  if (diffMs <= twoHoursMs) {
    const minsLeft = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return {
      isEligible: false,
      hoursRemaining: diffMs / (60 * 60 * 1000),
      reason: `Cancellation closed (starts in ${minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m`})`
    };
  }

  const hoursRemaining = Math.floor(diffMs / (60 * 60 * 1000));
  const minsRemaining = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  return {
    isEligible: true,
    hoursRemaining,
    minsRemaining,
    reason: `Cancellable until 2 hours before show`
  };
};
