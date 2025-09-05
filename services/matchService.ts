import { Item } from "@/types/item";
import { getDistanceInKm } from "@/utils/distance";

export const findMatchingItem = (newItem: Item, allItems: Item[]): Item | null => {
  const oppositeStatus = newItem.status === "Lost" ? "Found" : "Lost";

  return allItems.find(item => {
    if (item.status !== oppositeStatus) return false;
    if (item.category !== newItem.category) return false;

    // Optional location check
    if (newItem.location?.latitude && newItem.location?.longitude &&
        item.location?.latitude && item.location?.longitude) {
      const distance = getDistanceInKm(
        newItem.location.latitude,
        newItem.location.longitude,
        item.location.latitude,
        item.location.longitude
      );
      if (distance > 1) return false; // Ignore if too far
    }

    // Keyword matching for title
    const newWords = newItem.title.toLowerCase().split(" ");
    const itemWords = item.title.toLowerCase().split(" ");
    const commonWords = newWords.filter(word => itemWords.includes(word));
    if (commonWords.length > 0) return true;

    return false;
  }) || null;
};
