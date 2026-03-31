import styles from "./UserDot.module.css";

/**
 * UserDot — Glowing center dot representing the user's position.
 * Includes expanding pulse rings for a "live" indicator effect.
 */
export default function UserDot() {
  return (
    <div className={styles.dotWrapper}>
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing2} />
      <div className={styles.dot} />
    </div>
  );
}
