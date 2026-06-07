import dotenv from 'dotenv';
import dns from 'dns';
// Force Google DNS to resolve MongoDB Atlas SRV records correctly on Windows local network
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import { School } from '../models/School';
import { User } from '../models/User';
import { Listing } from '../models/Listing';
import { BarterMatch } from '../models/BarterMatch';
import { ChatThread, ChatMessage } from '../models/Chat';
import { Review } from '../models/Review';
import { logger } from '../utils/logger';
import crypto from 'crypto';

dotenv.config();

const hashPhoneNumber = (phone: string): string => {
  const normalizedPhone = phone.trim().replace(/[^\d+]/g, '');
  return crypto.createHash('sha256').update(normalizedPhone).digest('hex');
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB.');

    // Clean up existing records to avoid duplicate conflicts
    logger.info('Clearing old collections...');
    await School.deleteMany({});
    await User.deleteMany({});
    await Listing.deleteMany({});
    await BarterMatch.deleteMany({});
    await ChatThread.deleteMany({});
    await ChatMessage.deleteMany({});
    await Review.deleteMany({});
    logger.info('Collections cleared.');

    // 1. Seed Schools
    logger.info('Seeding schools...');
    const school1 = await School.create({
      name: 'Delhi Public School, Nagpur',
      board: 'cbse',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440001',
      location: { type: 'Point', coordinates: [79.0882, 21.1458] },
      adminPin: 'DPSNAG01',
      isPartner: true,
      partnerTier: 'basic',
    });

    const school2 = await School.create({
      name: 'Kendriya Vidyalaya, Pune',
      board: 'cbse',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      location: { type: 'Point', coordinates: [73.8567, 18.5204] },
      adminPin: 'KVPUNE01',
      isPartner: false,
    });

    const school3 = await School.create({
      name: "St. Mary's High School, Hyderabad",
      board: 'state',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      location: { type: 'Point', coordinates: [78.4867, 17.385] },
      adminPin: 'STMARY01',
      isPartner: true,
      partnerTier: 'premium',
    });
    logger.info(`Seeded 3 schools.`);

    // 2. Seed Users
    logger.info('Seeding users...');
    
    // Priya (Nagpur parent)
    const priyaHash = hashPhoneNumber('+919876543210');
    const userPriya = await User.create({
      phoneHash: priyaHash,
      displayName: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      schoolId: school1._id,
      defaultGrade: 8,
      language: 'hi',
      isNgo: false,
      ratingAvg: 4.8,
      ratingCount: 5,
    });

    // Rajan (Nagpur parent in same school, children in grade 9)
    const rajanHash = hashPhoneNumber('+919876543211');
    const userRajan = await User.create({
      phoneHash: rajanHash,
      displayName: 'Rajan Verma',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      schoolId: school1._id,
      defaultGrade: 9,
      language: 'en',
      isNgo: false,
      ratingAvg: 4.5,
      ratingCount: 3,
    });

    // Karan (Pune parent)
    const karanHash = hashPhoneNumber('+919876543213');
    const userKaran = await User.create({
      phoneHash: karanHash,
      displayName: 'Karan Joshi',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      schoolId: school2._id,
      defaultGrade: 5,
      language: 'en',
      isNgo: false,
      ratingAvg: 4.6,
      ratingCount: 2,
    });

    // NGO Coordinator
    const ngoHash = hashPhoneNumber('+919876543212');
    const userNgo = await User.create({
      phoneHash: ngoHash,
      displayName: 'Sister Anitha',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      schoolId: school3._id,
      defaultGrade: 5,
      language: 'te',
      isNgo: true,
      ngoVerifiedAt: new Date(),
    });
    logger.info(`Seeded 4 users.`);

    // 3. Seed Listings
    logger.info('Generating rich mock listings for all grades, categories, and modes...');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const categories = ['textbook', 'uniform_top', 'uniform_bottom', 'shoes', 'bag', 'stationery', 'other'];
    const modes = ['sell', 'barter', 'free'];
    const users = [userPriya, userRajan, userKaran, userNgo];

    const categoryTemplates: Record<string, { titles: string[], desc: string, img: string }> = {
      textbook: {
        titles: ['NCERT Mathematics Book', 'NCERT Science Textbook', 'English Honeysuckle Reader', 'Sanskrit Grammar Guide', 'Social Science History Book'],
        desc: 'In clean condition, minimal pencil notes, all pages intact.',
        img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e'
      },
      uniform_top: {
        titles: ['Half Sleeve School Shirt', 'Navy Blue School Blazer', 'V-Neck Winter Sweater', 'White Sports T-Shirt'],
        desc: 'Washed and ironed, buttons intact, standard size fit.',
        img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35'
      },
      uniform_bottom: {
        titles: ['Grey Uniform Trousers', 'Uniform Pleated Skirt', 'Sports Track Pants', 'Khaki Uniform Shorts'],
        desc: 'Good elastic, no stitches broken, color remains dark.',
        img: 'https://images.unsplash.com/photo-1542272604-787c3835535d'
      },
      shoes: {
        titles: ['Black Action Leather Shoes', 'White Canvas PT Shoes', 'Bata School Shoes'],
        desc: 'Soles are intact, polished, comfortable fit for school standards.',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
      },
      bag: {
        titles: ['Ergonomic School Backpack', 'Waterproof 3-Zip School Bag', 'Wildcraft Blue School Bag'],
        desc: 'All zippers working, spacious bottle holders, padded shoulders.',
        img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
      },
      stationery: {
        titles: ['Camel Geometry Box Set', 'Apsara Pencil & Eraser Bundle', 'Hardbound Longbook Pack'],
        desc: 'Leftover/unused stationery items, perfect for the new semester.',
        img: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634'
      },
      other: {
        titles: ['Stainless Steel Water Bottle', 'Leak-proof Lunch Box Set', 'School Lab Coat'],
        desc: 'Clean, sanitized, ready for school daily use.',
        img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8'
      }
    };

    let listingCount = 0;

    for (let g = 1; g <= 12; g++) {
      for (const cat of categories) {
        for (const md of modes) {
          // Select seller based on combinations
          let seller = users[(g + cat.length + md.length) % users.length];
          
          // NGO users shouldn't create sell/barter listings, switch them to general parent
          if (md !== 'free' && seller.isNgo) {
            seller = g % 2 === 0 ? userPriya : userRajan;
          }

          const schoolId = seller.schoolId;
          const template = categoryTemplates[cat];
          const titleToken = template.titles[(g + md.length) % template.titles.length];
          const finalTitle = `Class ${g} ${titleToken}`;

          // Price starts at ₹150 + Class dependency increment
          const pricePaise = md === 'sell' ? (150 + (g * 25)) * 100 : undefined;
          
          // Barter wanted item configuration
          const barterWantCategory = md === 'barter' ? categories[(categories.indexOf(cat) + 1) % categories.length] : undefined;
          const barterWantGrade = md === 'barter' ? (g === 12 ? 11 : g + 1) : undefined;
          const barterWantSubject = md === 'barter' && cat === 'textbook' ? 'Science' : undefined;

          const conditionOptions: Array<'like_new' | 'good' | 'fair' | 'worn'> = ['like_new', 'good', 'fair'];
          const condition = conditionOptions[(g + cat.length) % conditionOptions.length];

          await Listing.create({
            sellerId: seller._id,
            schoolId: schoolId,
            grade: g,
            category: cat,
            subject: cat === 'textbook' ? 'Core Syllabus' : undefined,
            title: finalTitle,
            description: `${template.desc} Previously used at ${seller.displayName}'s household.`,
            condition,
            mode: md,
            pricePaise,
            barterWantCategory,
            barterWantGrade,
            barterWantSubject,
            images: [template.img],
            isActive: true,
            isBoosted: g % 4 === 0, // promote 25% of listings
            expiresAt: expiry,
          });

          listingCount++;
        }
      }
    }

    logger.info(`Successfully generated ${listingCount} supply listings covering all Grades (1-12), Categories, and Exchange Modes.`);
    logger.info('Database seeding completed successfully.');
    
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  } catch (err: any) {
    logger.error(`Error during seeding: ${err.message}`);
    process.exit(1);
  }
};

seed();
