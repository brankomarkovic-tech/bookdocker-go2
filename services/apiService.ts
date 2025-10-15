import { Expert } from '../types';
import { EXAMPLE_EXPERTS } from '../exampleData';

const DB_KEY = 'bookdocker_experts';

// FIX: Created a custom error class for handling duplicate email submissions.
export class DuplicateEmailError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DuplicateEmailError';
    }
}

// FIX: Implemented a mock database using localStorage for client-side persistence.
const initializeDb = () => {
    if (!localStorage.getItem(DB_KEY)) {
        // We don't store the example experts in our "DB" as they are static.
        localStorage.setItem(DB_KEY, JSON.stringify([]));
    }
};

initializeDb();

// Helper to get all "real" experts from localStorage
const getDbExperts = (): Expert[] => {
    const dbData = localStorage.getItem(DB_KEY);
    return dbData ? JSON.parse(dbData) : [];
};

// Helper to save experts to localStorage
const saveDbExperts = (experts: Expert[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(experts));
};


// --- API Functions ---

/**
 * Fetches all "real" experts from the database (localStorage).
 * Example experts are added separately in the AppContext.
 */
export const getExperts = async (): Promise<Expert[]> => {
    console.log("API: Fetching experts from localStorage.");
    // Simulate network delay
    await new Promise(res => setTimeout(res, 300));
    return getDbExperts();
};

/**
 * Creates a new expert and saves it to the database.
 */
export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'isExample'>): Promise<Expert> => {
    console.log("API: Creating new expert.", expertData);
    await new Promise(res => setTimeout(res, 500));
    
    const dbExperts = getDbExperts();
    
    // Check for duplicate email
    if (dbExperts.some(e => e.email.toLowerCase() === expertData.email.toLowerCase()) || EXAMPLE_EXPERTS.some(e => e.email.toLowerCase() === expertData.email.toLowerCase())) {
        throw new DuplicateEmailError(`An expert with email ${expertData.email} already exists.`);
    }

    const newExpert: Expert = {
        ...expertData,
        id: `db-user-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        isExample: false, // All DB users are real users
    };

    const updatedExperts = [...dbExperts, newExpert];
    saveDbExperts(updatedExperts);

    return newExpert;
};

/**
 * Updates an existing expert's data in the database.
 */
export const updateExpert = async (expertId: string, profileData: Partial<Expert>): Promise<Expert> => {
    console.log(`API: Updating expert ${expertId}`, profileData);
    await new Promise(res => setTimeout(res, 500));
    
    const dbExperts = getDbExperts();
    const expertIndex = dbExperts.findIndex(e => e.id === expertId);

    if (expertIndex === -1) {
        throw new Error("Expert not found in database.");
    }
    
    const updatedExpert = {
        ...dbExperts[expertIndex],
        ...profileData,
        updatedAt: new Date().toISOString(),
    };

    dbExperts[expertIndex] = updatedExpert;
    saveDbExperts(dbExperts);

    return updatedExpert;
};


/**
 * Deletes multiple experts from the database by their IDs.
 */
export const deleteMultipleExperts = async (expertIds: string[]): Promise<void> => {
    console.log("API: Deleting experts with IDs:", expertIds);
    await new Promise(res => setTimeout(res, 800));

    let dbExperts = getDbExperts();
    const expertIdsSet = new Set(expertIds);

    const updatedExperts = dbExperts.filter(e => !expertIdsSet.has(e.id));
    
    saveDbExperts(updatedExperts);
};
