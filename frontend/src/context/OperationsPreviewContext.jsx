import { createContext, useContext, useState } from 'react';
import { PREVIEW_INVENTORY, SHIFTS } from '../data/operations';

const OperationsPreviewContext = createContext(null);

export function OperationsPreviewProvider({ children }) {
  const [shifts, setShifts] = useState(SHIFTS);
  const [staffProfiles, setStaffProfiles] = useState({});
  const [employeeUpdates, setEmployeeUpdates] = useState({});
  const [previewEmployees, setPreviewEmployees] = useState([]);
  const [hiddenEmployeeIds, setHiddenEmployeeIds] = useState([]);
  const [attendanceOverrides, setAttendanceOverrides] = useState({});
  const [inventoryItems, setInventoryItems] = useState(PREVIEW_INVENTORY);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState([]);

  const dismissAlert = (id) => {
    setDismissedAlerts((current) => current.includes(id) ? current : [...current, id]);
    setReadAlertIds((current) => current.includes(id) ? current : [...current, id]);
  };
  const markAlertRead = (id) => {
    setReadAlertIds((current) => current.includes(id) ? current : [...current, id]);
  };
  const markAlertsRead = (ids) => {
    setReadAlertIds((current) => [...new Set([...current, ...ids])]);
  };

  return (
    <OperationsPreviewContext.Provider value={{
      shifts, setShifts, staffProfiles, setStaffProfiles, employeeUpdates, setEmployeeUpdates,
      previewEmployees, setPreviewEmployees, hiddenEmployeeIds, setHiddenEmployeeIds,
      attendanceOverrides, setAttendanceOverrides, inventoryItems, setInventoryItems,
      dismissedAlerts, readAlertIds, dismissAlert, markAlertRead, markAlertsRead
    }}>
      {children}
    </OperationsPreviewContext.Provider>
  );
}

export function useOperationsPreview() {
  return useContext(OperationsPreviewContext);
}
