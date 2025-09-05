// services/notificationService.ts
import { Item } from "@/types/item";

/**
 * Sends a notification or email to the owner when a matching item is found.
 * @param originalItem The item already in the database (the one that is matched).
 * @param matchedItem The newly added item that matches.
 */
export const sendMatchNotification = async (originalItem: Item, matchedItem: Item) => {
  try {
    // Log match info (placeholder)
    console.log("==================================");
    console.log("MATCH FOUND!");
    console.log(`Original Item: ${originalItem.title}`);
    console.log(`Matched Item: ${matchedItem.title}`);
    console.log(`Notify owner at: ${originalItem.contactInfo}`);
    console.log("==================================");

    // TODO: Replace with actual notification service
    // Option 1: Send email via SendGrid/Nodemailer
    // Option 2: Use Firebase Cloud Functions to send push notifications
    // Option 3: Expo Notifications for in-app mobile notifications

    // Example pseudo-code for email:
    // await sendEmail(originalItem.contactInfo, "Item Match Found", `Your item "${originalItem.title}" matches a newly added item "${matchedItem.title}". Contact them at ${matchedItem.contactInfo}`);
  } catch (error) {
    console.error("Failed to send match notification:", error);
  }
};
