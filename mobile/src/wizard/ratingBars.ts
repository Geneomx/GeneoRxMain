export type RecordedRating = { time: number; value: number; key: string };

/** Keep every dated answer, including zero and separate answers on the same day. */
export function recordedRatings(points: Array<[number, number]>): RecordedRating[] {
  return points.flatMap(([time, value], index) => Number.isFinite(time) && Number.isFinite(value) && value >= 0 && value <= 10 ? [{ time, value, key: `${time}:${index}` }] : []).sort((a, b) => a.time - b.time);
}
