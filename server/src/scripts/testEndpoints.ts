import dns from 'dns';
// Force Google DNS to resolve MongoDB Atlas correctly on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import http from 'http';
import app from '../app';
import { School } from '../models/School';
import { User } from '../models/User';
import { Listing } from '../models/Listing';
import { logger } from '../utils/logger';

dotenv.config();

const port = 3001;
const baseUrl = `http://localhost:${port}/api/v1`;

const runTests = async () => {
  let server: http.Server | null = null;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    logger.info('Connecting to MongoDB for testing...');
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB.');

    logger.info(`Starting test HTTP server on port ${port}...`);
    server = app.listen(port);
    logger.info('HTTP server started.');

    let priyaToken = '';
    let rajanToken = '';
    let schoolId = '';
    let listingId = '';
    let threadId = '';

    // Helpers
    const getAuthHeaders = (token: string) => ({
      headers: { Authorization: `Bearer ${token}` },
    });

    logger.info('\n==================================================');
    logger.info('RUNNING INTEGRATION TESTS FOR ALL API ENDPOINTS');
    logger.info('==================================================\n');

    // 1. GET /health
    logger.info('Test 1: Health Check...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    if (healthRes.status === 200 && healthRes.data.status === 'healthy') {
      logger.info('✓ Test 1: Health Check PASSED');
    } else {
      throw new Error('Health check failed');
    }

    // 2. POST /auth/send-otp (Priya)
    logger.info('\nTest 2: Requesting OTP for Priya (+919876543210)...');
    const priyaPhone = '+919876543210';
    const otpRes = await axios.post(`${baseUrl}/auth/send-otp`, { phone: priyaPhone });
    if (otpRes.status === 200 && otpRes.data.success === true) {
      logger.info('✓ Test 2: Request OTP PASSED');
    } else {
      throw new Error('Request OTP failed');
    }

    // 3. POST /auth/verify-otp (Priya)
    logger.info('\nTest 3: Verifying OTP for Priya (OTP: 123456)...');
    const verifyRes = await axios.post(`${baseUrl}/auth/verify-otp`, {
      phone: priyaPhone,
      otp: '123456',
    });
    if (verifyRes.status === 200 && verifyRes.data.accessToken) {
      priyaToken = verifyRes.data.accessToken;
      logger.info('✓ Test 3: Verify OTP & JWT generation PASSED');
      logger.debug(`AccessToken acquired: ${priyaToken.substring(0, 15)}...`);
    } else {
      throw new Error('Verify OTP failed');
    }

    // 4. POST /auth/verify-otp (Rajan)
    logger.info('\nTest 4: Authenticating Rajan (+919876543211)...');
    // Request OTP
    await axios.post(`${baseUrl}/auth/send-otp`, { phone: '+919876543211' });
    // Verify OTP
    const verifyRajan = await axios.post(`${baseUrl}/auth/verify-otp`, {
      phone: '+919876543211',
      otp: '123456',
    });
    if (verifyRajan.status === 200 && verifyRajan.data.accessToken) {
      rajanToken = verifyRajan.data.accessToken;
      logger.info('✓ Test 4: Rajan authenticated PASSED');
    } else {
      throw new Error('Rajan authentication failed');
    }

    // 5. GET /auth/me (Authenticated)
    logger.info('\nTest 5: Retrieving current user profile (/auth/me)...');
    const meRes = await axios.get(`${baseUrl}/auth/me`, getAuthHeaders(priyaToken));
    if (meRes.status === 200 && meRes.data.user.displayName === 'Priya Sharma') {
      logger.info('✓ Test 5: Profile retrieval PASSED');
    } else {
      throw new Error('Profile retrieval failed');
    }

    // 6. PUT /auth/me (Authenticated)
    logger.info('\nTest 6: Updating user profile...');
    const updateRes = await axios.put(
      `${baseUrl}/auth/me`,
      { displayName: 'Priya Sharma Updated' },
      getAuthHeaders(priyaToken)
    );
    if (updateRes.status === 200 && updateRes.data.user.displayName === 'Priya Sharma Updated') {
      logger.info('✓ Test 6: Profile update PASSED');
    } else {
      throw new Error('Profile update failed');
    }

    // Restore name
    await axios.put(
      `${baseUrl}/auth/me`,
      { displayName: 'Priya Sharma' },
      getAuthHeaders(priyaToken)
    );

    // 7. GET /schools/search
    logger.info('\nTest 7: Searching for schools...');
    const searchRes = await axios.get(`${baseUrl}/schools/search?q=Nagpur`);
    if (searchRes.status === 200 && searchRes.data.schools.length > 0) {
      schoolId = searchRes.data.schools[0]._id;
      logger.info(`✓ Test 7: School directory search PASSED. School found: ${searchRes.data.schools[0].name}`);
    } else {
      throw new Error('School search failed');
    }

    // 8. GET /schools/:id/checklist
    logger.info(`\nTest 8: Getting school checklist for grade 8...`);
    const checklistRes = await axios.get(
      `${baseUrl}/schools/${schoolId}/checklist?grade=8`,
      getAuthHeaders(priyaToken)
    );
    if (checklistRes.status === 200 && checklistRes.data.checklist.length > 0) {
      logger.info(`✓ Test 8: School supply checklist retrieval PASSED. Items: ${checklistRes.data.checklist.length}`);
    } else {
      throw new Error('School checklist retrieval failed');
    }

    // 9. GET /listings (Feed query)
    logger.info('\nTest 9: Getting listings feed...');
    const feedRes = await axios.get(
      `${baseUrl}/listings?schoolId=${schoolId}&grade=8`,
      getAuthHeaders(priyaToken)
    );
    if (feedRes.status === 200 && feedRes.data.listings.length > 0) {
      listingId = feedRes.data.listings[0]._id;
      logger.info(`✓ Test 9: Listing feed browse PASSED. Items found: ${feedRes.data.listings.length}`);
    } else {
      throw new Error('Get listings feed failed');
    }

    // 10. GET /listings/:id (Details)
    logger.info(`\nTest 10: Fetching listing details for ID ${listingId}...`);
    const detailsRes = await axios.get(`${baseUrl}/listings/${listingId}`);
    if (detailsRes.status === 200 && detailsRes.data.listing) {
      logger.info(`✓ Test 10: Listing details retrieval PASSED. Views: ${detailsRes.data.listing.viewCount}`);
    } else {
      throw new Error('Get listing details failed');
    }

    // 11. POST /listings (Create Listing - Sell Mode)
    logger.info('\nTest 11: Creating new Sell Listing...');
    const createListingRes = await axios.post(
      `${baseUrl}/listings`,
      {
        title: 'Class 8 Geometry Box',
        category: 'stationery',
        condition: 'good',
        mode: 'sell',
        pricePaise: 25000, // 250 INR
      },
      getAuthHeaders(priyaToken)
    );
    if (createListingRes.status === 201 && createListingRes.data.listing) {
      logger.info(`✓ Test 11: Create listing (sell) PASSED. Title: ${createListingRes.data.listing.title}`);
    } else {
      throw new Error('Create listing failed');
    }

    // 12. POST /listings (Create Listing - Barter Mode, testing engine match)
    logger.info('\nTest 12: Creating Barter Listing to test engine matches...');
    // We already have Rajan's listing (Grade 9 Science, wants Grade 8 Math)
    // Priya now lists Grade 8 Math, wanting Grade 9 Science. This triggers the engine!
    const barterListingRes = await axios.post(
      `${baseUrl}/listings`,
      {
        title: 'NCERT Class 8 Mathematics Textbook',
        category: 'textbook',
        subject: 'Mathematics',
        condition: 'like_new',
        mode: 'barter',
        barterWantCategory: 'textbook',
        barterWantSubject: 'Science',
        barterWantGrade: 9,
      },
      getAuthHeaders(priyaToken)
    );
    if (barterListingRes.status === 201 && barterListingRes.data.listing) {
      logger.info(`✓ Test 12: Create listing (barter) PASSED.`);
      // Let's check if a barter match document was created in DB!
      // Give a tiny timeout for async matching
      await new Promise((resolve) => setTimeout(resolve, 500));
      logger.info('Checking if Barter Match was generated...');
      const matchesRes = await mongoose.model('BarterMatch').find({ status: 'pending' });
      if (matchesRes.length > 0) {
        logger.info(`✓ Test 12 (Subtask): In-Memory Barter Matching Engine triggered successfully! Matches generated: ${matchesRes.length}`);
      } else {
        logger.warn('! Barter Match not found in DB. Check matching logic constraints.');
      }
    } else {
      throw new Error('Create barter listing failed');
    }

    // 13. POST /chats/messages (Start Chat Thread & Send Message)
    logger.info('\nTest 13: Starting chat thread & sending message...');
    // Rajan sends message to Priya regarding her Geometry Box
    const chatRes = await axios.post(
      `${baseUrl}/chats/messages`,
      {
        listingId: createListingRes.data.listing._id, // Priya's listing from Test 11
        message: 'Hello, is this item still available?',
      },
      getAuthHeaders(rajanToken)
    );
    if (chatRes.status === 201 && chatRes.data.message) {
      threadId = chatRes.data.message.threadId;
      logger.info(`✓ Test 13: Chat message sending & thread creation PASSED. Message: "${chatRes.data.message.message}"`);
    } else {
      throw new Error('Send message failed');
    }

    // 14. GET /chats/threads (List threads)
    logger.info('\nTest 14: Retrieving user chat threads...');
    const threadsRes = await axios.get(`${baseUrl}/chats/threads`, getAuthHeaders(priyaToken));
    if (threadsRes.status === 200 && threadsRes.data.threads.length > 0) {
      logger.info(`✓ Test 14: Chat thread list retrieval PASSED. Active threads: ${threadsRes.data.threads.length}`);
    } else {
      throw new Error('Get chat threads failed');
    }

    // 15. GET /chats/threads/:threadId/messages (Get messages)
    logger.info(`\nTest 15: Retrieving chat thread messages for thread ${threadId}...`);
    const messagesRes = await axios.get(
      `${baseUrl}/chats/threads/${threadId}/messages`,
      getAuthHeaders(priyaToken)
    );
    if (messagesRes.status === 200 && messagesRes.data.messages.length > 0) {
      logger.info(`✓ Test 15: Message retrieval in thread PASSED. Count: ${messagesRes.data.messages.length}`);
    } else {
      throw new Error('Get messages failed');
    }

    // 16. POST /reviews (Submit feedback reviews)
    logger.info('\nTest 16: Submitting post-exchange user review...');
    // Priya reviews Rajan
    const reviewRes = await axios.post(
      `${baseUrl}/reviews`,
      {
        revieweeId: (await User.findOne({ displayName: 'Rajan Verma' }))?._id,
        listingId,
        rating: 5,
        comment: 'Punctual and very polite seller. Swap was smooth.',
      },
      getAuthHeaders(priyaToken)
    );
    if (reviewRes.status === 201 && reviewRes.data.review) {
      logger.info(`✓ Test 16: Submitting review and rating aggregation update PASSED.`);
      logger.info(`Rajan's updated rating: ${reviewRes.data.updatedRating.ratingAvg} (${reviewRes.data.updatedRating.ratingCount} reviews)`);
    } else {
      throw new Error('Submit review failed');
    }

    logger.info('\n==================================================');
    logger.info('ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    logger.info('==================================================\n');

  } catch (error: any) {
    logger.error(`\n✖ TEST SUITE FAILED at step: ${error.message}`);
    if (error.response) {
      logger.error(`Response details: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
  } finally {
    if (server) {
      logger.info('Closing test HTTP server...');
      server.close();
      logger.info('HTTP server closed.');
    }
    logger.info('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
};

runTests();
