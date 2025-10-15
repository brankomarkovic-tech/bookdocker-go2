

export enum BookGenre {
  AGRICULTURE = "Agriculture",
  AI = "AI",
  AIRCRAFT = "Aircraft",
  ANCIENT_WORLD = "Ancient World",
  ANIMALS = "Animals",
  ANIMATION = "Animation",
  ANTHROPOLOGY = "Anthropology",
  ARCHEOLOGY = "Archeology",
  ARCHITECTURE = "Architecture",
  ARMY = "Army",
  ART = "Art",
  BABYSITTING = "Babysitting",
  BEAUTY = "Beauty",
  BIOGRAPHY = "Biography",
  BIOLOGY = "Biology",
  BUSINESS = "Business",
  CALLIGRAPHY = "Calligraphy",
  CAREER = "Career",
  CARS = "Cars",
  CHEMISTRY = "Chemistry",
  CINEMA = "Cinema",
  COACHING = "Coaching",
  CODING = "Coding",
  COMEDY = "Comedy",
  COMICS = "Comics",
  COMMUNICATION = "Communication",
  COMPUTER_SCIENCE = "Computer Science",
  CONSULTING = "Consulting",
  CONSTRUCTION = "Construction",
  COOKBOOKS = "Cookbooks",
  COSMETICS = "Cosmetics",
  CRIME = "Crime",
  DECORATION = "Decoration",
  DESIGN = "Design",
  DIPLOMACY = "Diplomacy",
  DIVING = "Diving",
  DOCUMENTARY = "Documentary",
  DRAMA = "Drama",
  ECONOMICS = "Economics",
  EDUCATION = "Education",
  ENGINEERING = "Engineering",
  ENTREPRENEURSHIP = "Entrepreneurship",
  EXPLORATION = "Exploration",
  FAIRIES = "Fairies",
  FANTASY = "Fantasy",
  FASHION = "Fashion",
  FICTION = "Fiction",
  FISHING = "Fishing",
  FITNESS = "Fitness",
  FUNGUS = "Fungus",
  GAMING = "Gaming",
  GEOLOGY = "Geology",
  HEALTH = "Health",
  HIKING = "Hiking",
  HISTORY = "History",
  HOUSING = "Housing",
  HUMANITY = "Humanity",
  HUNTING = "Hunting",
  INSECTS = "Insects",
  INTERNET = "Internet",
  JAZZ = "Jazz",
  KIDS = "Kids",
  LAKES = "Lakes",
  LANGUAGES = "Languages",
  LEADERSHIP = "Leadership",
  LEGAL_STUDIES = "Legal Studies",
  LOVE = "Love",
  MANAGEMENT = "Management",
  MARKETING = "Marketing",
  MATHEMATICS = "Mathematics",
  MEDICINE = "Medicine",
  MENTORSHIP = "Mentorship",
  MINDSET = "Mindset",
  MONEY = "Money",
  MOTIVATION = "Motivation",
  MOUNTAINS = "Mountains",
  MUSIC = "Music",
  MYSTERY = "Mystery",
  NATURE = "Nature",
  NOVELS = "Novels",
  NUTRITION = "Nutrition",
  OCEANS_AND_SEAS = "Oceans and Seas",
  OLYMPICS = "Olympics",
  PETS = "Pets",
  PHILOSOPHY = "Philosophy",
  PHOTOGRAPHY = "Photography",
  PHYSICS = "Physics",
  PLANETS = "Planets",
  PLANTS = "Plants",
  POETRY = "Poetry",
  POLITICS = "Politics",
  POPULAR_FICTION = "Popular Fiction",
  POWER = "Power",
  PRODUCTIVITY = "Productivity",
  PSYCHOANALYSIS = "Psychoanalysis",
  PSYCHOLOGY = "Psychology",
  REAL_ESTATE = "Real Estate",
  RELIGION = "Religion",
  RIVERS = "Rivers",
  ROCK_AND_ROLL = "Rock and Roll",
  ROMANCE = "Romance",
  SCIENCE_FICTION = "Science Fiction",
  SHIPS = "Ships",
  SHORT_STORIES = "Short Stories",
  SOCIETY = "Society",
  SOCIAL_GAMES = "Social Games",
  SPACE = "Space",
  SPACESHIPS = "Spaceships",
  SPORT = "Sport",
  STORYTELLING = "Storytelling",
  SWEETS = "Sweets",
  TECHNOLOGY = "Technology",
  THEATER = "Theater",
  THREE_D_MODELING = "3D Modeling",
  TRAGEDY = "Tragedy",
  TRAVEL = "Travel",
  WEAPONRY = "Weaponry",
  VISUAL_ART = "Visual Art",
}

export enum BookStatus {
  AVAILABLE = 'Available',
  SOLD = 'Sold',
  RESERVED = 'Reserved',
}

export enum UserRole {
  ADMIN = 'admin',
  EXPERT = 'expert',
  BUYER = 'buyer',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  status: BookStatus;
  addedAt: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  condition?: string;
  isbn?: string;
}

export interface Spotlight {
  id: string;
  title: string;
  content: string;
  featuredBookId?: string;
  audioUrl?: string;
}

export interface SocialLinks {
  x?: string;
  facebook?: string;
  linkedIn?: string;
  instagram?: string;
  youtube?: string;
}

export interface BookQuery {
    title: string;
    author: string;
    publisher?: string;
    edition?: string;
    year?: number;
}

export interface PresentOffer {
  bookId: string;
  booksRequired: number;
  message?: string;
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  subscriptionTier: SubscriptionTier;
  genre: BookGenre;
  country?: string;
  bio: string;
  avatarUrl?: string;
  onLeave: boolean;
  books: Book[];
  spotlights: Spotlight[];
  bookQuery?: BookQuery;
  socialLinks?: SocialLinks;
  presentOffer?: PresentOffer;
  createdAt: string;
  updatedAt?: string;
  isExample: boolean;
}

export interface WishlistItem {
  bookId: string;
  expertId: string;
}

export interface ModerationAlert {
  expertId: string;
  expertName: string;
  contentType: 'bio' | 'blogPostTitle' | 'blogPostContent';
  flaggedContent: string;
  reason: string;
}