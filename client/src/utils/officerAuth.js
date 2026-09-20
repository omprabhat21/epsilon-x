/**
 * Lightweight Officer Profile Helper
 * Stores officer name & designation for audit attribution & demo realism
 */

const STORAGE_KEY = 'epsilon_x_officer';

export const PRESET_OFFICERS = [
  { id: '1', name: 'Rajesh Kumar', designation: 'Assistant Manager' },
  { id: '2', name: 'Priya Sharma', designation: 'Deputy Manager' },
  { id: '3', name: 'Anil Mehta', designation: 'Senior Manager' },
];

export const DEFAULT_OFFICER = PRESET_OFFICERS[0];

export function getStoredOfficer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        // Clean legacy designation if it still contains , CPCL
        if (parsed.designation) {
          parsed.designation = parsed.designation.replace(/,\s*CPCL/gi, '');
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading officer from localStorage:', e);
  }
  return DEFAULT_OFFICER;
}

export function setStoredOfficer(officer) {
  try {
    const data = {
      name: officer.name?.trim() || DEFAULT_OFFICER.name,
      designation: officer.designation?.trim() || DEFAULT_OFFICER.designation,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Dispatch custom event for real-time header sync
    window.dispatchEvent(new Event('officer_profile_changed'));
    return data;
  } catch (e) {
    console.warn('Error saving officer to localStorage:', e);
    return DEFAULT_OFFICER;
  }
}
