// src/components/outlet/OperatingHours.jsx

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { formatTime } from "../../utils/formatters";

const OperatingHours = ({ hours }) => {
  // Sort days of the week in proper order using useMemo to avoid unnecessary re-sorts
  const sortedHours = useMemo(() => {
    if (!hours || hours.length === 0) return [];

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return [...hours].sort(
      (a, b) => days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week)
    );
  }, [hours]);

  if (!hours || hours.length === 0) {
    return (
      <p className="text-sm text-gray-500">No operating hours available</p>
    );
  }

  return (
    <div className="text-sm mt-2">
      <table className="w-full text-sm">
        <tbody>
          {sortedHours.map((hour) => (
            <tr
              key={hour.day_of_week}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="py-1 pr-2 font-medium">{hour.day_of_week}</td>
              <td className="py-1 text-gray-600">
                {hour.is_closed
                  ? "Closed"
                  : `${formatTime(hour.opening_time)} - ${formatTime(
                      hour.closing_time
                    )}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

OperatingHours.propTypes = {
  hours: PropTypes.arrayOf(
    PropTypes.shape({
      day_of_week: PropTypes.string.isRequired,
      is_closed: PropTypes.bool,
      opening_time: PropTypes.string,
      closing_time: PropTypes.string,
    })
  ),
};

export default OperatingHours;
