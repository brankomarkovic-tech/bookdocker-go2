import { Expert } from '../types';

/**
 * Normalizes a name or string into a URL-friendly slug.
 * Examples:
 *   "Branko Marković" -> "branko-markovic"
 *   "René & Mary-Jane O'Connor" -> "rene-mary-jane-o-connor"
 */
export function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD') // Separate accents from letters (e.g., 'ć' -> 'c' + accent)
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Generates the canonical URL slug for an expert.
 * If multiple experts share the exact same name, it appends a short slice of their ID.
 */
export function getExpertSlug(expert: Expert, allExperts?: Expert[]): string {
    const baseSlug = slugify(expert.name) || 'expert';
    if (!allExperts || allExperts.length <= 1) {
        return baseSlug;
    }

    const duplicates = allExperts.filter(e => slugify(e.name) === baseSlug);
    if (duplicates.length <= 1) {
        return baseSlug;
    }

    // If duplicate names exist, differentiate using the first 6 chars of their unique ID
    const shortId = expert.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();
    return `${baseSlug}-${shortId}`;
}

/**
 * Finds an expert by either their database ID or their name slug.
 */
export function findExpertBySlugOrId(identifier: string | undefined, experts: Expert[]): Expert | undefined {
    if (!identifier) return undefined;
    const cleanId = identifier.trim().toLowerCase();

    // 1. Direct match on ID
    const matchById = experts.find(e => e.id.toLowerCase() === cleanId);
    if (matchById) return matchById;

    // 2. Exact match on computed slug
    const matchBySlug = experts.find(e => getExpertSlug(e, experts) === cleanId);
    if (matchBySlug) return matchBySlug;

    // 3. Fallback match on base slugify(name)
    return experts.find(e => slugify(e.name) === cleanId);
}
