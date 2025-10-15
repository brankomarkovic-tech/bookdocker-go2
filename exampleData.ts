import { Expert, BookGenre, BookStatus, UserRole, UserStatus, SubscriptionTier } from './types';

export const EXAMPLE_EXPERTS: Expert[] = [
    {
        id: 'admin',
        name: 'Admin',
        email: 'admin@bookdocker.go2',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        subscriptionTier: SubscriptionTier.PREMIUM,
        genre: BookGenre.AI,
        bio: 'Administrator of BookDocker GO2.',
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
        books: [],
        onLeave: false,
        spotlights: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        isExample: true,
    },
    {
        id: 'premium-user-1',
        name: 'Dr. Aris Thorne',
        email: 'premium@bookdocker.go2',
        role: UserRole.EXPERT,
        status: UserStatus.ACTIVE,
        subscriptionTier: SubscriptionTier.PREMIUM,
        genre: BookGenre.SCIENCE_FICTION,
        country: 'United Kingdom',
        bio: 'A leading expert in classic science fiction, Dr. Thorne’s collection spans from the golden age pulps to modern cyberpunk. She offers rare first editions and insightful commentary on the genre\'s evolution.',
        avatarUrl: 'https://i.pravatar.cc/150?u=dr-aris-thorne-v2',
        onLeave: true,
        books: [
            { id: 'book-p1-1', title: 'Dune', author: 'Frank Herbert', year: 1965, status: BookStatus.AVAILABLE, price: 75, currency: 'USD', imageUrl: 'https://picsum.photos/seed/dune/200/300', addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p1-2', title: 'Foundation', author: 'Isaac Asimov', year: 1951, status: BookStatus.AVAILABLE, price: 60, currency: 'USD', imageUrl: 'https://picsum.photos/seed/foundation/200/300', addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p1-3', title: 'Neuromancer', author: 'William Gibson', year: 1984, status: BookStatus.AVAILABLE, price: 85, currency: 'USD', imageUrl: 'https://picsum.photos/seed/neuromancer/200/300', addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p1-4', title: 'Hyperion', author: 'Dan Simmons', year: 1989, status: BookStatus.SOLD, price: 50, currency: 'USD', imageUrl: 'https://picsum.photos/seed/hyperion/200/300', addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p1-5', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969, status: BookStatus.RESERVED, price: 45, currency: 'USD', imageUrl: 'https://picsum.photos/seed/lefthand/200/300', addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        spotlights: [
            { 
              id: 'spotlight-p1-1', 
              title: 'The Genius of Asimov', 
              content: 'Foundation is more than a book; it\'s a blueprint for the future of science fiction. Asimov\'s vision of psychohistory and galactic empires has influenced countless authors. In this audio note, I discuss its enduring legacy and the importance of this particular first edition.',
              featuredBookId: 'book-p1-2',
              audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            },
            { 
              id: 'spotlight-p1-2', 
              title: 'Beyond the Spice: The Ecology of Dune', 
              content: "Frank Herbert's masterpiece is more than a space opera; it's a profound ecological and political allegory. We'll explore how the desert planet of Arrakis, with its majestic sandworms and precious melange, serves as a character in its own right, shaping the destinies of houses Atreides and Harkonnen. This first edition is a cornerstone for any serious collector.",
              featuredBookId: 'book-p1-1',
              audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            }
        ],
        bookQuery: { title: 'Do Androids Dream of Electric Sheep?', author: 'Philip K. Dick', edition: 'First Edition Hardcover', },
        presentOffer: { bookId: 'book-p1-1', booksRequired: 3, message: 'Begin your journey to Arrakis with this complimentary gift for a fellow traveler.' },
        socialLinks: { x: 'https://x.com/bookdockergo2', facebook: 'https://facebook.com/bookdockergo2' },
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
        isExample: true,
    },
    {
        id: 'premium-user-2',
        name: 'Marco Verratti',
        email: 'marco@bookdocker.go2',
        role: UserRole.EXPERT,
        status: UserStatus.ACTIVE,
        subscriptionTier: SubscriptionTier.PREMIUM,
        genre: BookGenre.HISTORY,
        country: 'Italy',
        bio: 'Specializing in Mediterranean history, Marco curates a collection of books focusing on the Roman Empire and the Renaissance, offering deep insights and rare historical accounts.',
        avatarUrl: 'https://i.pravatar.cc/150?u=marco-verratti',
        onLeave: false,
        books: [
            { id: 'book-p2-1', title: 'SPQR: A History of Ancient Rome', author: 'Mary Beard', year: 2015, status: BookStatus.AVAILABLE, price: 35, currency: 'USD', imageUrl: 'https://picsum.photos/seed/spqr/200/300', addedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p2-2', title: 'The Swerve: How the World Became Modern', author: 'Stephen Greenblatt', year: 2011, status: BookStatus.AVAILABLE, price: 25, currency: 'USD', imageUrl: 'https://picsum.photos/seed/swerve/200/300', addedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p2-3', title: 'Rubicon: The Last Years of the Roman Republic', author: 'Tom Holland', year: 2003, status: BookStatus.AVAILABLE, price: 30, currency: 'USD', imageUrl: 'https://picsum.photos/seed/rubicon/200/300', addedAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        spotlights: [
            {
                id: 'spotlight-p2-1',
                title: 'The Res Publica of Rome',
                content: "Mary Beard's 'SPQR' is not just a history; it is an autopsy of a civilization. From its mythical founding to the reign of Caracalla, this work peels back the layers of Roman society, politics, and power. It's an essential text for understanding how an obscure village grew to dominate the known world, leaving a legacy that still echoes today.",
                featuredBookId: 'book-p2-1',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
            },
            {
                id: 'spotlight-p2-2',
                title: 'A Renaissance of Discovery',
                content: "Stephen Greenblatt's 'The Swerve' is a thrilling intellectual adventure that traces the rediscovery of Lucretius's 'On the Nature of Things.' This single event helped spark the Renaissance, challenging religious dogma and paving the way for modern thought. A must-read for anyone interested in the birth of new ideas.",
                featuredBookId: 'book-p2-2',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
            }
        ],
        bookQuery: { title: 'The Histories', author: 'Herodotus' },
        presentOffer: { bookId: 'book-p2-3', booksRequired: 3, message: 'A special gift for a true history aficionado.' },
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        isExample: true,
    },
    {
        id: 'premium-user-3',
        name: 'Kenji Tanaka',
        email: 'kenji@bookdocker.go2',
        role: UserRole.EXPERT,
        status: UserStatus.ACTIVE,
        subscriptionTier: SubscriptionTier.PREMIUM,
        genre: BookGenre.ART,
        country: 'Japan',
        bio: 'An art historian and gallerist, Kenji’s passion is for Ukiyo-e and modern Japanese art movements. His collection includes beautifully illustrated books and exhibition catalogs.',
        avatarUrl: 'https://i.pravatar.cc/150?u=kenji-tanaka-v2',
        onLeave: true,
        books: [
            { id: 'book-p3-1', title: 'The Great Wave: The Influence of Japanese Woodcuts on French Prints', author: 'Colta Feller Ives', year: 1974, status: BookStatus.AVAILABLE, price: 120, currency: 'USD', imageUrl: 'https://picsum.photos/seed/greatwave/200/300', addedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p3-2', title: 'Japanese Art', author: 'Joan Stanley-Baker', year: 2000, status: BookStatus.AVAILABLE, price: 40, currency: 'USD', imageUrl: 'https://picsum.photos/seed/japaneseart/200/300', addedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'book-p3-3', title: 'In Praise of Shadows', author: 'Junichiro Tanizaki', year: 1933, status: BookStatus.AVAILABLE, price: 55, currency: 'USD', imageUrl: 'https://picsum.photos/seed/shadows/200/300', addedAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        spotlights: [
            {
                id: 'spotlight-p3-1',
                title: "Hokusai's Enduring Ripple",
                content: "The Great Wave off Kanagawa is arguably the most famous image in Japanese art, but its influence extends far beyond the shores of Japan. This spotlight, featuring Colta Feller Ives' seminal work, explores how Ukiyo-e prints like Hokusai's transformed Western art, inspiring the Impressionists and shaping the course of modernism. A true bridge between two cultures.",
                featuredBookId: 'book-p3-1',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            },
            {
                id: 'spotlight-p3-2',
                title: 'The Aesthetics of Imperfection',
                content: "Tanizaki's 'In Praise of Shadows' is not an art book in the traditional sense, but an essential essay on Japanese aesthetics. It explores the love of shadow and subtlety over the bright glare of modernity. Understanding this philosophy is key to truly appreciating the nuances of Japanese art, from laquerware to architecture.",
                featuredBookId: 'book-p3-3',
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
            },
        ],
        bookQuery: { title: 'The Book of Tea', author: 'Okakura Kakuzo' },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        isExample: true,
    }
];