import { memo } from "react";
import styles from "./Compass.module.css";

/**
 * Compass — Small circular compass that rotates based on heading.
 * Shows N/E/S/W with a needle pointing north.
 *
 * @param {{ heading: number }} props
 */
function Compass({ heading }) {
  return (
    <div className={styles.compass} aria-label={`Compass heading ${heading}°`}>
      <div
        className={styles.compassInner}
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        {/* Cardinal labels */}
        <span className={`${styles.cardinalLabel} ${styles.labelN}`}>N</span>
        <span className={`${styles.cardinalLabel} ${styles.labelE}`}>E</span>
        <span className={`${styles.cardinalLabel} ${styles.labelS}`}>S</span>
        <span className={`${styles.cardinalLabel} ${styles.labelW}`}>W</span>

        {/* Needle */}
        <div className={styles.needle}>
          <div className={styles.needleNorth} />
          <div className={styles.needleSouth} />
        </div>

        {/* Center dot */}
        <div className={styles.compassCenter} />
      </div>
    </div>
  );
}

export default memo(Compass);
