import { Expert } from '../types';

const DB_KEY = 'bookdocker_experts';

// Custom Error for duplicate emails
export class DuplicateEmailError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DuplicateEmailError';
    }
}

// Helper to get data from localStorage
const getDb = (): Expert[] => {
    try {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return [];
    }
};

// Helper to save data to localStorage
const saveDb = (experts: Expert[]) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(experts));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};

export const getExperts = async (): Promise<Expert[]> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    return getDb();
};

export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt' | 'isExample'>): Promise<Expert> => {
    await new Promise(res => setTimeout(res, 500));
    const db = getDb();

    // Check for duplicate email
    if (db.some(e => e.email.toLowerCase() === expertData.email.toLowerCase())) {
        throw new DuplicateEmailError(`Email ${expertData.email} already exists.`);
    }

    const newExpert: Expert = {
        ...expertData,
        id: `db-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        isExample: false,
    };
    const updatedDb = [...db, newExpert];
    saveDb(updatedDb);
    return newExpert;
};

export const updateExpert = async (expertId: string, profileData: Partial<Expert>): Promise<Expert> => {
    await new Promise(res => setTimeout(res, 500));
    const db = getDb();
    const expertIndex = db.findIndex(e => e.id === expertId);
    if (expertIndex === -1) {
        throw new Error("Expert not found");
    }

    const updatedExpert = {
        ...db[expertIndex],
        ...profileData,
        updatedAt: new Date().toISOString(),
    };
    db[expertIndex] = updatedExpert;
    saveDb(db);
    return updatedExpert;
};


export const deleteMultipleExperts = async (expertIds: string[]): Promise<void> => {
    await new Promise(res => setTimeout(res, 1000));
    let db = getDb();
    db = db.filter(e => !expertIds.includes(e.id));
    saveDb(db);
};
