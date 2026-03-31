import styles from "./RadarGrid.module.css";

/**
 * RadarGrid — Renders concentric distance rings, crosshair lines,
 * distance labels (125m, 250m, 375m), and cardinal directions (N/E/S/W).
 */
export default function RadarGrid() {
  const distances = ["125m", "250m", "375m"];

  return (
    <div className={styles.gridLayer}>
      {/* Concentric rings */}
      <div className={styles.ring} />
      <div className={styles.ring} />
      <div className={styles.ring} />
      <div className={styles.ring} />

      {/* Distance labels */}
      {distances.map((label, i) => (
        <span key={label} className={styles.ringLabel}>
          {label}
        </span>
      ))}

      {/* Crosshair lines */}
      <div className={`${styles.crosshair} ${styles.crosshairH}`} />
      <div className={`${styles.crosshair} ${styles.crosshairV}`} />

      {/* Cardinal directions */}
      <span className={`${styles.cardinal} ${styles.cardinalN}`}>N</span>
      <span className={`${styles.cardinal} ${styles.cardinalE}`}>E</span>
      <span className={`${styles.cardinal} ${styles.cardinalS}`}>S</span>
      <span className={`${styles.cardinal} ${styles.cardinalW}`}>W</span>
    </div>
  );
}
