import { memo } from "react";
import styles from "./StatsBar.module.css";

/**
 * StatsBar — Displays LIVE indicator, crowd index level,
 * and heading/radius info above the radar.
 *
 * @param {{ overallDensity: string, heading: number, cardinalDirection: string }} props
 */
function StatsBar({ overallDensity, heading, cardinalDirection }) {
  const densityLower = overallDensity.toLowerCase();
  const crowdClass = styles[`crowd${capitalize(densityLower)}`];
  const badgeClass = styles[`badge${capitalize(densityLower)}`];
  const dotClass = styles[`badgeDot${capitalize(densityLower)}`];

  return (
    <div className={styles.statsBar}>
      {/* Left column: LIVE + Crowd Index */}
      <div className={styles.statsLeft}>
        <div className={styles.liveTag}>
          <span className={styles.liveDot} />
          LIVE
        </div>
        <div className={styles.crowdIndex}>
          <span className={styles.crowdLabel}>Crowd Index</span>
          <span className={`${styles.crowdValue} ${crowdClass}`}>
            {overallDensity}
          </span>
        </div>
      </div>

      {/* Center: heading chip */}
      <div className={styles.headingChip}>
        <span className={styles.headingIcon}>↑</span>
        {cardinalDirection} · 500m radius
      </div>

      {/* Density badge (top-right area, rendered alongside compass in parent) */}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default memo(StatsBar);
