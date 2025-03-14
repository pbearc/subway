import re
from datetime import datetime, time
from typing import List, Dict, Any, Tuple, Optional

# Types
HourRecord = Dict[str, Any]

def process_operating_hours(outlet_name: str, raw_hours: str) -> List[HourRecord]:
    """
    Process raw operating hours text into structured data.
    
    Args:
        outlet_name: Name of the outlet
        raw_hours: Raw text of operating hours
        
    Returns:
        List of dictionaries containing structured operating hours
    """
    if not raw_hours or raw_hours.lower() == 'opening soon':
        return []
        
    parser = OperatingHoursParser(outlet_name)
    return parser.parse(raw_hours)
    
    
class OperatingHoursParser:
    """Parser for operating hours in various formats."""
    
    def __init__(self, outlet_name: str):
        self.outlet_name = outlet_name
        self.all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        self.day_abbreviation_map = {
            "Mon": "Monday", "Tue": "Tuesday", "Tues": "Tuesday", "Wed": "Wednesday",
            "Thu": "Thursday", "Thur": "Thursday", "Thurs": "Thursday", 
            "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday"
        }
        # Store records by day to resolve conflicts
        self.day_records = {}
        
    def parse(self, raw_hours: str) -> List[HourRecord]:
        """Parse raw hours string into structured records."""
        lines = raw_hours.split("\n")
        
        # Reset day records for each parsing
        self.day_records = {day: None for day in self.all_days}
        
        # Process each line and collect records
        for line in lines:
            line = line.strip()
            if not line:  # Skip empty lines
                continue
                
            parsed_records = self._parse_line(line)
            
            # Update day records with the latest information
            for record in parsed_records:
                day = record['day_of_week']
                
                # Special handling for closed days - they take precedence
                if record['is_closed']:
                    self.day_records[day] = record
                # Otherwise only update if no record exists or if it's not a closed record
                elif self.day_records[day] is None or not self.day_records[day]['is_closed']:
                    self.day_records[day] = record
        
        # Return non-None records
        return [record for record in self.day_records.values() if record is not None]
    
    def _parse_line(self, line: str) -> List[HourRecord]:
        """Parse a single line of operating hours."""
        # Check for closed days first
        closed_day_records = self._try_parse_closed_day(line)
        if closed_day_records:
            return closed_day_records
            
        # Try specific patterns
        records = self._try_parse_all_week_pattern(line)
        if records:
            return records
            
        records = self._try_parse_day_range_with_time_range(line)
        if records:
            return records
            
        records = self._try_parse_day_range_pattern(line)
        if records:
            return records
            
        records = self._try_parse_specific_day_with_hours(line)
        if records:
            return records
        
        # Generic pattern as fallback
        return self._parse_generic_pattern(line)
    
    def _try_parse_closed_day(self, line: str) -> List[HourRecord]:
        """Try to parse a line indicating a closed day."""
        # Match patterns like "Tuesday : Close" or "Tuesday: Closed"
        pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*[:]\s*(?:Close|Closed)", re.IGNORECASE)
        match = pattern.search(line)
        
        if not match:
            return []
            
        day = self._clean_day(match.group(1))
        return [self._create_hour_record(day, None, None, True)]
        
    def _try_parse_all_week_pattern(self, line: str) -> List[HourRecord]:
        """Try to parse a line with 'Mon-Sun (9:00AM to 10:00PM)' pattern."""
        # Match "(10:00AM - 6:00PM)" type format
        pattern1 = re.compile(r"(Mon(?:day)?\s*-\s*Sun(?:day)?)\s*\((\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)\)")
        # Match "10:00 AM – 8:00PM" type format
        pattern2 = re.compile(r"(Mon(?:day)?\s*-\s*Sun(?:day)?)\s*,\s*(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)")
        
        match = pattern1.search(line) or pattern2.search(line)
        
        if not match:
            return []
            
        start_time = self._parse_time(match.group(2))
        end_time = self._parse_time(match.group(3))
        
        return [
            self._create_hour_record(day, start_time, end_time, False)
            for day in self.all_days
        ]
    
    def _try_parse_day_range_with_time_range(self, line: str) -> List[HourRecord]:
        """Parse patterns like '0800 - 2200 (Sun - Thur)' or '0800 - 2230 (Fri & Sat)'."""
        pattern = re.compile(r"(\d{4})\s*-\s*(\d{4})\s*\(([\w\s&-]+)\)")
        match = pattern.search(line)
        
        if not match:
            return []
            
        time_start = self._parse_time(match.group(1))
        time_end = self._parse_time(match.group(2))
        day_text = match.group(3).strip()
        
        days = self._parse_day_range(day_text)
        
        return [
            self._create_hour_record(day, time_start, time_end, False)
            for day in days
        ]
    
    def _try_parse_day_range_pattern(self, line: str) -> List[HourRecord]:
        """Parse patterns like 'Monday - Saturday, 8:00 AM – 9:00PM'."""
        pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*-\s*((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*,\s*(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)")
        match = pattern.search(line)
        
        if not match:
            return []
            
        start_day = self._clean_day(match.group(1))
        end_day = self._clean_day(match.group(2))
        start_time = self._parse_time(match.group(3))
        end_time = self._parse_time(match.group(4))
        
        # Get all days in the range
        days = self._get_day_range(start_day, end_day)
        
        return [
            self._create_hour_record(day, start_time, end_time, False)
            for day in days
        ]
    
    def _try_parse_specific_day_with_hours(self, line: str) -> List[HourRecord]:
        """Parse patterns like 'Friday, 9:00 AM – 9:00PM'."""
        pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*,\s*(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)")
        match = pattern.search(line)
        
        if not match:
            return []
            
        day = self._clean_day(match.group(1))
        start_time = self._parse_time(match.group(2))
        end_time = self._parse_time(match.group(3))
        
        return [self._create_hour_record(day, start_time, end_time, False)]
        
    def _parse_generic_pattern(self, line: str) -> List[HourRecord]:
        """Parse using generic day and time patterns."""
        # Check for day ranges and individual days
        day_pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?(?:\s*[-&]\s*(?:(?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)?)*)")
        
        # Match time patterns, both 12-hour and 24-hour formats
        time_pattern = re.compile(r"(\d{1,2}:\d{2}\s*[AP]M)\s*[-–to]\s*(\d{1,2}:\d{2}\s*[AP]M)")
        time_pattern_24h = re.compile(r"(\d{4})\s*-\s*(\d{4})")
        
        day_matches = day_pattern.findall(line)
        time_matches = time_pattern.findall(line) or time_pattern_24h.findall(line)
        
        is_closed = 'close' in line.lower() or 'closed' in line.lower()
        
        if time_matches:
            start_time, end_time = map(self._parse_time, time_matches[0])
        else:
            start_time = end_time = None
        
        day_list = []
        for day_group in day_matches:
            day_list.extend(self._parse_day_range(day_group))
        
        # Remove duplicates while preserving order
        seen = set()
        day_list = [day for day in day_list if not (day in seen or seen.add(day))]
        
        return [
            self._create_hour_record(day, start_time, end_time, is_closed)
            for day in day_list if day in self.all_days
        ]
        
    def _get_day_range(self, start_day: str, end_day: str) -> List[str]:
        """Get all days in a range from start_day to end_day."""
        if start_day not in self.all_days or end_day not in self.all_days:
            return []
            
        start_idx = self.all_days.index(start_day)
        end_idx = self.all_days.index(end_day)
        
        # Handle case where end_day is earlier in week than start_day
        if end_idx < start_idx:
            return self.all_days[start_idx:] + self.all_days[:end_idx+1]
        else:
            return self.all_days[start_idx:end_idx+1]
        
    def _parse_day_range(self, day_text: str) -> List[str]:
        """Parse a range of days like 'Mon-Fri' or 'Mon & Wed'."""
        day_list = []
        
        # Split by commas first to handle comma-separated entries
        comma_parts = [p.strip() for p in day_text.split(',')]
        
        for part in comma_parts:
            # Handle day ranges with hyphens
            if '-' in part:
                range_parts = [p.strip() for p in part.split('-')]
                if len(range_parts) == 2:
                    start_day = self._clean_day(range_parts[0])
                    end_day = self._clean_day(range_parts[1])
                    
                    if start_day in self.all_days and end_day in self.all_days:
                        day_list.extend(self._get_day_range(start_day, end_day))
                else:
                    # Handle single day with trailing hyphen
                    day = self._clean_day(range_parts[0])
                    if day in self.all_days:
                        day_list.append(day)
            # Handle ampersand separated days
            elif '&' in part:
                for day in part.split('&'):
                    clean_day = self._clean_day(day)
                    if clean_day in self.all_days:
                        day_list.append(clean_day)
            else:
                # Handle single day
                clean_day = self._clean_day(part)
                if clean_day in self.all_days:
                    day_list.append(clean_day)
                        
        return day_list
        
    def _clean_day(self, day: str) -> str:
        """Clean and normalize day name."""
        day = day.strip().rstrip(',').title()
        return self.day_abbreviation_map.get(day, day)
        
    def _parse_time(self, time_str: str) -> Optional[time]:
        """Parse time string in various formats."""
        time_str = time_str.strip()
        try:
            # Try standard AM/PM format with space
            return datetime.strptime(time_str, "%I:%M %p").time()
        except ValueError:
            try:
                # Try without space between time and AM/PM
                return datetime.strptime(time_str, "%I:%M%p").time()
            except ValueError:
                try:
                    # Try 24-hour format (HHMM)
                    return datetime.strptime(time_str, "%H%M").time()
                except ValueError:
                    # If all else fails, try various other common formats
                    for fmt in ["%I:%M%p", "%I:%M %p", "%H:%M", "%I%p", "%H%M"]:
                        try:
                            return datetime.strptime(time_str, fmt).time()
                        except ValueError:
                            continue
                    return None
                    
    def _create_hour_record(self, day: str, start_time: Optional[time], 
                           end_time: Optional[time], is_closed: bool) -> HourRecord:
        """Create a standardized hour record dictionary."""
        return {
            'outlet_name': self.outlet_name,
            'day_of_week': day,
            'opening_time': start_time.strftime('%H:%M:%S') if start_time else None,
            'closing_time': end_time.strftime('%H:%M:%S') if end_time else None,
            'is_closed': is_closed
        }