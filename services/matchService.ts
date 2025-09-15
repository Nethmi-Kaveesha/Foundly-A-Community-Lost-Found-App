import { Item } from "@/types/item";

// Return the first matching item with opposite status, same category, and fuzzy title match
export const findMatchingItem = (item: Item, items: Item[]): Item | null => {
  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .split(" ")
      .filter(Boolean);

  const newItemWords = clean(item.title);

  return (
    items.find((i) => {
      if (i.id === item.id) return false;

      // Ensure opposite status
      if (
        (item.status === "Lost" && i.status !== "Found") ||
        (item.status === "Found" && i.status !== "Lost")
      )
        return false;

      if (i.category !== item.category) return false;

      const itemWords = clean(i.title);

      // At least 1 common word in title
      const commonWords = newItemWords.filter((word) => itemWords.includes(word));

      return commonWords.length > 0;
    }) || null
  );
};
