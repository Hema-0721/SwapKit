import { Listing, IListing } from '../models/Listing';
import { BarterMatch } from '../models/BarterMatch';
import { logger } from '../utils/logger';
import { getIO } from '../index'; // Socket IO will be exported from index

export const scanForBarterMatches = async (newListingId: string): Promise<void> => {
  try {
    const l1 = await Listing.findById(newListingId);
    if (!l1 || !l1.isActive || l1.mode !== 'barter') {
      return;
    }

    logger.info(`[BarterEngine] Scanning matches for listing: ${l1.title} (${l1._id})`);

    // Match criteria for L2:
    // 1. Same school
    // 2. Active barter listing
    // 3. Different seller
    // 4. L2's item category must match what L1 wants (l1.barterWantCategory)
    const query: any = {
      schoolId: l1.schoolId,
      sellerId: { $ne: l1.sellerId },
      isActive: true,
      mode: 'barter',
      category: l1.barterWantCategory,
    };

    if (l1.barterWantGrade !== undefined && l1.barterWantGrade !== null) {
      query.grade = l1.barterWantGrade;
    }

    if (l1.barterWantSubject) {
      query.subject = { $regex: new RegExp(`^${l1.barterWantSubject.trim()}$`, 'i') };
    }

    const potentialMatches = await Listing.find(query);
    logger.info(`[BarterEngine] Found ${potentialMatches.length} candidates for user want criteria`);

    for (const l2 of potentialMatches) {
      // Evaluate match score
      // A match is FULL if L2 also wants L1's item category/subject/grade.
      // Otherwise it's PARTIAL.
      let isFullMatch = false;

      const l2WantsL1Category = l2.barterWantCategory === l1.category;
      const l2WantsL1Grade = l2.barterWantGrade === undefined || l2.barterWantGrade === null || l2.barterWantGrade === l1.grade;
      const l2WantsL1Subject = !l2.barterWantSubject || !l1.subject || l2.barterWantSubject.toLowerCase() === l1.subject.toLowerCase();

      if (l2WantsL1Category && l2WantsL1Grade && l2WantsL1Subject) {
        isFullMatch = true;
      }

      const matchScore = isFullMatch ? 'full' : 'partial';

      // Order listing IDs to avoid duplicate rows (e.g., A matches B is same as B matches A)
      const listingAId = l1._id.toString() < l2._id.toString() ? l1._id : l2._id;
      const listingBId = l1._id.toString() < l2._id.toString() ? l2._id : l1._id;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Matches expire in 7 days

      try {
        const match = await BarterMatch.findOneAndUpdate(
          { listingAId, listingBId },
          {
            listingAId,
            listingBId,
            matchScore,
            status: 'pending',
            notifiedAt: new Date(),
            expiresAt,
          },
          { upsert: true, new: true }
        );

        logger.info(`[BarterEngine] Created/Updated ${matchScore} barter match ${match._id} between ${l1._id} and ${l2._id}`);

        // Notify sellers via Socket.io if connected
        const io = getIO();
        if (io) {
          // Send to rooms corresponding to user IDs
          io.to(l1.sellerId.toString()).emit('barterMatch', {
            matchId: match._id,
            score: matchScore,
            myListing: l1,
            matchedListing: l2,
          });
          io.to(l2.sellerId.toString()).emit('barterMatch', {
            matchId: match._id,
            score: matchScore,
            myListing: l2,
            matchedListing: l1,
          });
        }
      } catch (upsertError: any) {
        logger.error(`[BarterEngine] Error saving barter match: ${upsertError.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`[BarterEngine] Error in matching execution: ${error.message}`);
  }
};
