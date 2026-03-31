import { useCallback } from "react";
import styles from "./ActionButtons.module.css";

/**
 * ActionButtons — Report Crowd, SOS, and Safe Routes action buttons.
 * In production these would trigger API calls or emergency services.
 */
export default function ActionButtons() {
  const handleReport = useCallback(() => {
    // TODO: integrate with backend API
    console.log("[CrowdPilot] Crowd report submitted");
  }, []);

  const handleSOS = useCallback(() => {
    // TODO: integrate with emergency services
    console.log("[CrowdPilot] SOS triggered!");
  }, []);

  const handleRoutes = useCallback(() => {
    // TODO: integrate with routing engine
    console.log("[CrowdPilot] Safe routes requested");
  }, []);

  return (
    <div className={styles.buttonsRow}>
      <button
        id="btn-report-crowd"
        className={`${styles.actionBtn} ${styles.reportBtn}`}
        onClick={handleReport}
        aria-label="Report crowd density"
      >
        <span className={styles.reportIcon}>📍</span>
        Report Crowd
      </button>

      <button
        id="btn-sos"
        className={`${styles.actionBtn} ${styles.sosBtn}`}
        onClick={handleSOS}
        aria-label="Emergency SOS"
      >
        SOS
      </button>

      <button
        id="btn-safe-routes"
        className={`${styles.actionBtn} ${styles.routeBtn}`}
        onClick={handleRoutes}
        aria-label="Find safe routes"
      >
        <span className={styles.routeIcon}>🔍</span>
        Safe Routes
      </button>
    </div>
  );
}
