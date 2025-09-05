/**
 * Utility functions for parsing dates and scheduling arguments
 */

/**
 * Parse schedule command arguments
 * @param {string} content - The full message content
 * @returns {Object|null} Parsed event data or null if invalid
 */
function parseScheduleArgs(content) {
  // Expected format:
  // [event name] on the [dd/mm/yyyy] and time [HH:mm AM/PM], location [location]
  // Format: /schedule Ice Skating on the 19/07/2025 7:00PM Rod Laver Stadium

  // Remove command prefix
  const input = content.slice('/schedule '.length).trim();
  const onTheIndex = input.indexOf(' on the ');
  if (onTheIndex === -1) return null;

  const name = input.slice(0, onTheIndex).trim();
  const rest = input.slice(onTheIndex + 8).trim();

  // date time is first two parts, then location is rest
  // date time: e.g. 19/07/2025 7:00PM
  const firstSpaceIndex = rest.indexOf(' ');
  if (firstSpaceIndex === -1) return null;

  const datePart = rest.slice(0, 10); // dd/mm/yyyy is always 10 chars
  const timeAndLocation = rest.slice(11).trim();

  // Time is until first space or until AM/PM
  const timeRegex = /^(\d{1,2}:\d{2}(AM|PM))/i;
  const timeMatch = timeAndLocation.match(timeRegex);
  if (!timeMatch) return null;

  const time = timeMatch[1];
  const location = timeAndLocation.slice(time.length).trim();

  // Parse date and time into JS Date
  // Convert dd/mm/yyyy and time (HH:mmAM/PM) to Date object
  const [day, month, year] = datePart.split('/');
  let hourMinute = time.toUpperCase(); // e.g. 7:00PM
  // Parse hour and minute and AM/PM
  const timeMatch2 = hourMinute.match(/(\d{1,2}):(\d{2})(AM|PM)/);
  if (!timeMatch2) return null;
  let hour = parseInt(timeMatch2[1]);
  const minute = parseInt(timeMatch2[2]);
  const ampm = timeMatch2[3];
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const date = new Date(year, month - 1, day, hour, minute);

  if (isNaN(date.getTime())) return null;

  return { name, date, location };
}

module.exports = {
  parseScheduleArgs
};
