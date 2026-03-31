import { memo } from "react";
import styles from "./DirectionArrow.module.css";

/**
 * DirectionArrow — Arrow from center pointing in the user's heading direction.
 * Rotates dynamically based on heading (0° = North = up).
 *
 * @param {{ heading: number }} props
 */
function DirectionArrow({ heading }) {
  return (
    <div
      className={styles.arrowLayer}
      style={{ transform: `rotate(${heading}deg)` }}
    >
      <svg className={styles.arrowSvg} viewBox="0 0 100 100">
        {/* Main line from center going up (then rotated by heading) */}
        <line
          x1="50" y1="50"
          x2="50" y2="8"
          className={styles.arrowLine}
        />
        {/* Arrowhead */}
        <polygon
          points="50,4 46,14 54,14"
          className={styles.arrowTip}
        />
      </svg>
    </div>
  );
}

export default memo(DirectionArrow);
