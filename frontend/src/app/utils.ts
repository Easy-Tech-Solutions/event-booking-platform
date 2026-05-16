// Browsing history utility
export function addToBrowsingHistory(eventId: string) {
  let history = JSON.parse(localStorage.getItem('browsingHistory') || '[]');
  if (!history.includes(eventId)) {
    history.push(eventId);
    localStorage.setItem('browsingHistory', JSON.stringify(history));
  }
}

export function getBrowsingHistory() {
  return JSON.parse(localStorage.getItem('browsingHistory') || '[]');
}

// Geolocation utility
export function getUserLocation(callback: (coords: { lat: number; lng: number } | null) => void) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => callback(null)
    );
  } else {
    callback(null);
  }
}
