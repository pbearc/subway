import re
from datetime import datetime, time
from typing import List, Dict, Any, Tuple, Optional

# Types
HourRecord = Dict[str, Any]

def process_operating_hours(outlet_name: str, raw_hours: str) -> List[HourRecord]:
    """
    Process raw operating hours text into structured data.
    """
    if not raw_hours or raw_hours.lower() == 'opening soon':
        return []
        
    raw_hours = raw_hours.strip('"')
        
    parser = OperatingHoursParser(outlet_name)
    return parser.parse(raw_hours)
    
    
class OperatingHoursParser:
    """Parser for operating hours in various formats."""
    
    def __init__(self, outlet_name: str):
        self.outlet_name = outlet_name
        self.all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        self.allowed_days = self.all_days + ["Public Holiday"]
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
        self.day_records = {day: None for day in self.allowed_days}  # Use allowed_days instead of all_days
        
        for line in lines:
            line = line.strip()
            if not line:
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
        # First check: try to parse "Sunday, Closed" pattern
        if "closed" in line.lower() and "," in line:
            day_part = line.split(",")[0].strip()
            if self._is_day_name(day_part):
                day = self._clean_day(day_part)
                return [self._create_hour_record(day, None, None, True)]
        
        # Special check for "Public Holiday" (handle as a separate case)
        if "public holiday" in line.lower() and "," in line:
            # Extract time part
            time_parts = line.split(",", 2)
            if len(time_parts) >= 2:
                time_part = time_parts[-1].strip()
                
                # Match time pattern
                time_pattern = re.compile(r"(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
                time_match = time_pattern.search(time_part)
                
                if time_match:
                    start_time = self._parse_time(time_match.group(1))
                    end_time = self._parse_time(time_match.group(2))
                    
                    # Add a special Public Holiday record (in addition to normal days)
                    public_holiday_record = self._create_hour_record("Public Holiday", start_time, end_time, False)
                    
        # Special check for "Saturday, Sunday & Public Holiday" format
        if "saturday, sunday & public holiday" in line.lower():
            # Extract time part
            time_parts = line.split(",", 2)
            if len(time_parts) >= 2:
                time_part = time_parts[-1].strip()
                
                # Match time pattern
                time_pattern = re.compile(r"(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
                time_match = time_pattern.search(time_part)
                
                if time_match:
                    start_time = self._parse_time(time_match.group(1))
                    end_time = self._parse_time(time_match.group(2))
                    
                    # Explicitly include Saturday, Sunday, and Public Holiday
                    return [
                        self._create_hour_record("Saturday", start_time, end_time, False),
                        self._create_hour_record("Sunday", start_time, end_time, False),
                        self._create_hour_record("Public Holiday", start_time, end_time, False)
                    ]
        
        # parse ampersand pattern
        if "&" in line and "," in line:
            day_part = line.split(",")[0].strip()
            # Check if the first part matches day names
            if any(day_name.lower() in day_part.lower() for day_name in self.all_days + list(self.day_abbreviation_map.keys())):
                # Get time part (after the comma)
                time_part = line.split(",", 1)[1].strip()
                
                # Match time pattern
                time_pattern = re.compile(r"(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
                time_match = time_pattern.search(time_part)
                
                if time_match:
                    start_time = self._parse_time(time_match.group(1))
                    end_time = self._parse_time(time_match.group(2))
                    
                    # Process the day text to extract all day names
                    days = []
                    include_public_holiday = False
                    
                    # Handle Public Holiday
                    if "public holiday" in day_part.lower():
                        include_public_holiday = True
                        # Make sure to still include "Sunday" in the special case
                        if "sunday" in day_part.lower():
                            days.append("Sunday")
                        # Remove the Public Holiday text for further processing
                        day_part = day_part.replace("Public Holiday", "").replace("public holiday", "")
                    
                    # Check specifically for "Sunday" in the text
                    if "sunday" in day_part.lower():
                        if "Sunday" not in days:
                            days.append("Sunday")
                    
                    # Split by & and process each part
                    for part in day_part.replace("&", ",").split(","):
                        part = part.strip()
                        if not part:
                            continue
                        
                        # Handle day ranges with hyphens
                        if "-" in part or "–" in part:
                            range_parts = re.split(r'[-–]', part)
                            if len(range_parts) == 2:
                                start_day = self._clean_day(range_parts[0])
                                end_day = self._clean_day(range_parts[1])
                                
                                if start_day in self.all_days and end_day in self.all_days:
                                    days.extend(self._get_day_range(start_day, end_day))
                        else:
                            # Handle single day
                            clean_day = self._clean_day(part)
                            if clean_day in self.all_days and clean_day not in days:
                                days.append(clean_day)
                    
                    result = [
                        self._create_hour_record(day, start_time, end_time, False)
                        for day in days
                    ]
                    
                    # Add Public Holiday record if needed
                    if include_public_holiday:
                        result.append(self._create_hour_record("Public Holiday", start_time, end_time, False))
                    
                    return result
    
        # Check for closed days
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
    
    def _is_day_name(self, text: str) -> bool:
        """Check if a string is a valid day name or abbreviation."""
        text = text.strip().title()
        return text in self.all_days or text in self.day_abbreviation_map
    
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
        """Try to parse a line with 'Mon-Sun' pattern."""
        patterns = [
            # Mon-Sun (10:00AM - 6:00PM)
            r"(Mon(?:day)?\s*[-–]\s*Sun(?:day)?)\s*\((\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\)",
            # Mon-Sun, 10:00 AM - 10:00 PM
            r"(Mon(?:day)?\s*[-–]\s*Sun(?:day)?)\s*,\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)",
            # Monday - Sunday 10:00 AM - 10:00 PM (no comma)
            r"(Mon(?:day)?\s*[-–]\s*Sun(?:day)?)\s+(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)",
            # Monday - Sunday (08:00AM to 10:00PM)
            r"(Mon(?:day)?\s*[-–]\s*Sun(?:day)?)\s*\((\d{1,2}(?::\d{2})?\s*[AP]M)\s*to\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\)",
            # Monday to Sunday (10:00AM - 10:00PM)
            r"(Mon(?:day)?\s*to\s*Sun(?:day)?)\s*\((\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\)"
        ]
        
        for pattern_str in patterns:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            match = pattern.search(line)
            
            if match:
                start_time = self._parse_time(match.group(2))
                end_time = self._parse_time(match.group(3))
                
                return [
                    self._create_hour_record(day, start_time, end_time, False)
                    for day in self.all_days
                ]
        
        return []
    
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
        pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*[-–]\s*((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*,\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
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
        pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)\s*,\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
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
        day_pattern = re.compile(r"((?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?(?:\s*[-–&]\s*(?:(?:Mon|Tues?|Wed(?:nes)?|Thur?s?|Fri|Sat(?:ur)?|Sun)(?:day)?)?)*)", re.IGNORECASE)
        
        # Match time patterns, both 12-hour and 24-hour formats
        time_pattern = re.compile(r"(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[-–to]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)", re.IGNORECASE)
        time_pattern_24h = re.compile(r"(\d{4})\s*-\s*(\d{4})")
        # Simple pattern for formats like "10am-6pm"
        time_pattern_simple = re.compile(r"(\d{1,2})(?:am|pm)\s*-\s*(\d{1,2})(?:am|pm)", re.IGNORECASE)
        
        day_matches = day_pattern.findall(line)
        time_matches = time_pattern.findall(line) or time_pattern_24h.findall(line) or time_pattern_simple.findall(line)
        
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
            part = part.strip()
            if not part:
                continue
                
            # Handle day ranges with hyphens
            if '-' in part or '–' in part:
                range_parts = re.split(r'[-–]', part)
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
                amp_parts = [p.strip() for p in part.split('&')]
                for amp_part in amp_parts:
                    if not amp_part or amp_part.lower() == 'public holiday':
                        continue
                    clean_day = self._clean_day(amp_part)
                    if clean_day in self.all_days and clean_day not in day_list:
                        day_list.append(clean_day)
            else:
                # Handle single day
                clean_day = self._clean_day(part)
                if clean_day in self.all_days and clean_day not in day_list:
                    day_list.append(clean_day)
                        
        return day_list
        
    def _clean_day(self, day: str) -> str:
        """Clean and normalize day name."""
        day = day.strip().rstrip(',').title()
        # Handle cases like "saturday" and "sunday" explicitly
        if day.lower() == "saturday":
            return "Saturday"
        elif day.lower() == "sunday":
            return "Sunday"
        return self.day_abbreviation_map.get(day, day)
        
    def _parse_time(self, time_str: str) -> Optional[time]:
        """Parse time string in various formats."""
        time_str = time_str.strip()
        
        # Handle simple formats like "10am" without colon
        simple_match = re.match(r"^(\d{1,2})(am|pm)$", time_str, re.IGNORECASE)
        if simple_match:
            hour = int(simple_match.group(1))
            ampm = simple_match.group(2).lower()
            
            if ampm == 'pm' and hour < 12:
                hour += 12
            elif ampm == 'am' and hour == 12:
                hour = 0
                
            return time(hour=hour, minute=0)
            
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
                    # Try various other common formats
                    for fmt in ["%I:%M%p", "%I:%M %p", "%H:%M", "%I%p", "%H%M"]:
                        try:
                            return datetime.strptime(time_str, fmt).time()
                        except ValueError:
                            continue
                            
                    # Manual parse for patterns like "10am"
                    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", time_str, re.IGNORECASE)
                    if match:
                        hour = int(match.group(1))
                        minute = int(match.group(2)) if match.group(2) else 0
                        ampm = match.group(3).lower()
                        
                        if ampm == 'pm' and hour < 12:
                            hour += 12
                        elif ampm == 'am' and hour == 12:
                            hour = 0
                            
                        return time(hour=hour, minute=minute)
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