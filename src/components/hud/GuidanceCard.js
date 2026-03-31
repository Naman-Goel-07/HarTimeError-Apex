import { memo } from "react";
import styles from "./GuidanceCard.module.css";

/**
 * GuidanceCard — Shows contextual navigation guidance.
 * Displays warning message, suggestion text, and suggested angle.
 *
 * @param {{ message: string, suggestion: string, suggestedAngle: number|null, severity: string }} props
 */
function GuidanceCard({ message, suggestion, suggestedAngle, severity }) {
  const sev = capitalize(severity);

  const iconMap = {
    high: "⚠",
    medium: "⚠",
    low: "✓",
  };

  return (
    <div className={`${styles.card} ${styles[`card${sev}`]}`}>
      {/* Icon */}
      <div className={`${styles.cardIcon} ${styles[`icon${sev}`]}`}>
        {iconMap[severity] || "⚠"}
      </div>

      {/* Text */}
      <div className={styles.cardContent}>
        <span className={`${styles.cardTitle} ${styles[`title${sev}`]}`}>
          {message}
        </span>
        <span className={styles.cardSubtitle}>{suggestion}</span>
      </div>

      {/* Angle badge */}
      {suggestedAngle !== null && (
        <div className={`${styles.angleBadge} ${styles[`angleBadge${sev}`]}`}>
          → {suggestedAngle}°
        </div>
      )}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default memo(GuidanceCard);
