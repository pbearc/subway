import googlemaps
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

gmaps = googlemaps.Client(key=API_KEY)

def geocode_address_google(address):
    try:
        geocode_result = gmaps.geocode(address)
        if geocode_result:
            location = geocode_result[0]["geometry"]["location"]
            return location["lat"], location["lng"]
        else:
            print(f"No coordinates found for address: {address}")
            return None, None
    except Exception as e:
        print(f"Error: {e}")
        return None, None

# Test addresses
sample_addresses = [
    "Jalan Bangsar Utama 1, Unit 1-2-G, Menara UOA Bangsar, Kuala Lumpur, 59000",
    "318A One Utama, Lower Ground Floor, New Wing, 1 Utama Shopping Centre, Petaling Jaya, 47800",
    "G9, Wisma UOA II, 19, Jalan Pinang, Kuala Lumpur, 50450"
]

for address in sample_addresses:
    lat, lon = geocode_address_google(address)
    print(f"Address: {address}\nCoordinates: {lat}, {lon}\n")
