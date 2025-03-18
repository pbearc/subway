import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import PropTypes from "prop-types";
import OperatingHours from "./OperatingHours";
import IntersectingOutlets from "./IntersectingOutlets";
import StatusIndicator from "../common/StatusIndicator";
import Button from "../common/Button";
import api from "../../services/api";
import { determineOutletStatus } from "../../utils/formatters";
import {
  findOutletsWithinRadius,
  sortOutletsByDistance,
} from "../../utils/distanceCalculator";
import Icon from "../common/Icon";

const OutletDetails = ({ outlet, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [operatingHours, setOperatingHours] = useState([]);
  const [error, setError] = useState(null);
  const [showingRadius, setShowingRadius] = useState(false);
  const [status, setStatus] = useState("Unknown");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [topOffset, setTopOffset] = useState(0);
  const outletDetailsRef = useRef(null);

  // Memoized intersecting outlets
  const intersectingOutlets = useMemo(() => {
    if (!outlet || !outlet.allOutlets) return [];

    const outletsInRadius = findOutletsWithinRadius(
      outlet,
      outlet.allOutlets,
      5
    );

    return sortOutletsByDistance(
      outletsInRadius,
      parseFloat(outlet.latitude),
      parseFloat(outlet.longitude)
    );
  }, [outlet]);

  // Check for mobile size on resize and adjust top offset based on header height
  useEffect(() => {
    const checkMobileSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const updateTopOffset = () => {
      // Get header element
      const headerElement = document.querySelector("header");
      if (headerElement) {
        // Get the actual height of the header
        const headerHeight = headerElement.offsetHeight;
        setTopOffset(headerHeight);
      }
    };

    // Initial setup
    checkMobileSize();
    updateTopOffset();

    // Add event listeners
    window.addEventListener("resize", () => {
      checkMobileSize();
      updateTopOffset();
    });

    // Run once after component mounts to make sure header height is calculated
    setTimeout(updateTopOffset, 100);

    return () => {
      window.removeEventListener("resize", checkMobileSize);
      window.removeEventListener("resize", updateTopOffset);
    };
  }, []);

  // Fetch operating hours
  useEffect(() => {
    const fetchOperatingHours = async () => {
      if (!outlet) return;

      try {
        setLoading(true);

        // Use existing hours or fetch from API
        const hours =
          outlet.operating_hours?.length > 0
            ? outlet.operating_hours
            : await api.getOutletOperatingHours(outlet.id);

        setOperatingHours(hours);
        setStatus(determineOutletStatus(hours));
      } catch (error) {
        console.error("Error fetching operating hours:", error);
        setError("Could not load operating hours");
      } finally {
        setLoading(false);
      }
    };

    fetchOperatingHours();

    // Reset radius state
    setShowingRadius(false);

    // Cleanup radius when unmounting or changing outlet
    return () => {
      if (outlet?.hideRadius) {
        outlet.hideRadius();
      }
    };
  }, [outlet?.id, outlet?.operating_hours]);

  // Toggle 5km radius display
  const toggleRadiusDisplay = useCallback(() => {
    if (showingRadius) {
      outlet?.hideRadius?.();
      setShowingRadius(false);
    } else {
      outlet?.showRadius?.(outlet);
      setShowingRadius(true);
    }
  }, [outlet, showingRadius]);

  // Render nothing if no outlet
  if (!outlet) return null;

  // Render mobile or desktop view
  return isMobile ? (
    <div
      ref={outletDetailsRef}
      className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden"
      style={{
        top: `${topOffset}px`,
        height: `calc(100% - ${topOffset}px)`,
      }}
    >
      {/* Mobile Outlet Details Header - Styled like desktop */}
      <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
        <div>
          <h2 className="text-xl font-bold text-green-800 flex-1 truncate">
            {outlet.name}
          </h2>
          <StatusIndicator status={status} className="mt-1" />
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-600 hover:bg-gray-100 rounded-full p-2"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
        {/* Status Indicator removed from here since it's now in the header */}

        {/* Outlet Address */}
        <div>
          <h3 className="text-green-800 font-semibold mb-2">Location</h3>
          <p className="text-gray-700">{outlet.address}</p>

          {/* Map Links */}
          <div className="flex space-x-2 mt-3">
            {outlet.waze_link && (
              <a
                href={outlet.waze_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Icon name="map" size={4} className="mr-1" />
                Waze
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Icon name="location" size={4} className="mr-1" />
              Google Maps
            </a>
          </div>
        </div>

        {/* 5KM Radius Button */}
        <div>
          <Button
            onClick={toggleRadiusDisplay}
            variant={showingRadius ? "danger" : "blue"}
            className="w-full"
            icon={<Icon name="map" size={4} />}
            iconPosition="left"
          >
            {showingRadius ? "Hide 5KM Radius" : "Show 5KM Radius"}
          </Button>
        </div>

        {/* Operating Hours */}
        <div>
          <h3 className="text-green-800 font-semibold mb-2">Operating Hours</h3>
          {loading ? (
            <p className="text-gray-500">Loading hours...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <OperatingHours hours={operatingHours} />
          )}
        </div>

        {/* Nearby Outlets */}
        {intersectingOutlets.length > 0 && (
          <IntersectingOutlets
            currentOutlet={outlet}
            intersectingOutlets={intersectingOutlets}
          />
        )}
      </div>
    </div>
  ) : (
    // Desktop Sidebar View
    <div className="h-full flex flex-col bg-white overflow-y-auto p-4 space-y-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-bold text-green-800">{outlet.name}</h2>
          <StatusIndicator status={status} className="mt-1" />
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Rest of the content follows mobile layout */}
      <div className="space-y-4">
        {/* Location */}
        <div>
          <h3 className="text-green-800 font-semibold mb-2">Location</h3>
          <p className="text-gray-700">{outlet.address}</p>

          <div className="flex space-x-2 mt-3">
            {outlet.waze_link && (
              <a
                href={outlet.waze_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Icon name="map" size={4} className="mr-1" />
                Waze
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Icon name="location" size={4} className="mr-1" />
              Google Maps
            </a>
          </div>
        </div>

        {/* 5KM Radius Button */}
        <div>
          <Button
            onClick={toggleRadiusDisplay}
            variant={showingRadius ? "danger" : "blue"}
            className="w-full"
            icon={<Icon name="map" size={4} />}
            iconPosition="left"
          >
            {showingRadius ? "Hide 5KM Radius" : "Show 5KM Radius"}
          </Button>
        </div>

        {/* Operating Hours */}
        <div>
          <h3 className="text-green-800 font-semibold mb-2">Operating Hours</h3>
          {loading ? (
            <p className="text-gray-500">Loading hours...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <OperatingHours hours={operatingHours} />
          )}
        </div>

        {/* Nearby Outlets */}
        {intersectingOutlets.length > 0 && (
          <IntersectingOutlets
            currentOutlet={outlet}
            intersectingOutlets={intersectingOutlets}
          />
        )}
      </div>
    </div>
  );
};

OutletDetails.propTypes = {
  outlet: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string,
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    waze_link: PropTypes.string,
    operating_hours: PropTypes.array,
    allOutlets: PropTypes.array,
    showRadius: PropTypes.func,
    hideRadius: PropTypes.func,
    isRadiusActive: PropTypes.func,
    setRadiusCallback: PropTypes.func,
  }),
  onClose: PropTypes.func.isRequired,
};

export default OutletDetails;
