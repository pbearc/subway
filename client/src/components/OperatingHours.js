import React from "react";

const OperatingHours = ({ hours }) => {
  // Sort days of the week in order
  const daysOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const sortedHours = [...hours].sort(
    (a, b) =>
      daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
  );

  // Format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  return (
    <div className="mt-2">
      {sortedHours.length === 0 ? (
        <p className="text-sm text-gray-500">No operating hours available</p>
      ) : (
        <ul className="space-y-1">
          {sortedHours.map((hour) => (
            <li key={hour.day_of_week} className="flex justify-between text-sm">
              <span className="font-medium">{hour.day_of_week}</span>
              <span className="text-gray-700">
                {hour.is_closed
                  ? "Closed"
                  : `${formatTime(hour.opening_time)} - ${formatTime(
                      hour.closing_time
                    )}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OperatingHours;
