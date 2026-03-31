import styles from "./ScanLine.module.css";

/**
 * ScanLine — Animated radar sweep line with a trailing glow.
 * Rotates 360° continuously for the classic radar effect.
 */
export default function ScanLine() {
  return (
    <div className={styles.scanLayer}>
      <div className={styles.scanTrail} />
      <div className={styles.scanLine} />
    </div>
  );
}
