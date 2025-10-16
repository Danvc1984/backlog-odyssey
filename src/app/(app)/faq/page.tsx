
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
    // --- General ---
    {
        category: "General",
        question: "What is Backlog Odyssey, and what can I do with it?",
        answer: "Backlog Odyssey is an AI-powered app designed to help you manage your video game collection and, most importantly, conquer your backlog. The primary goal is to make digging through your unplayed games a fun and adventurous experience. You can organize your games into lists, get intelligent recommendations on what to play next, create fun challenges, and track your progress, all in one place."
    },
    {
        category: "General",
        question: "Why does the site start out empty?",
        answer: "The app is designed to be highly personal and configurable. Game data from external sources can sometimes be opinionated, wrong, or incomplete. By starting with a blank slate, we give you full liberty to add only the games you want to track and tailor the data to your specific needs. This ensures your library is accurate and perfectly suited to you, without any clutter."
    },
    {
        category: "General",
        question: "How can I share ideas or feedback?",
        answer: "We'd love to hear from you! If you have any ideas, feedback, or run into any issues, please feel free to send an email to danvc1984@gmail.com."
    },
    {
        category: "General",
        question: "Can I make a local copy of the app?",
        answer: "Yes! The app is open-source. You can find the complete source code on GitHub at https://github.com/Danvc1984/backlog-odyssey. Feel free to fork the repository, explore the code, and run your own local instance."
    },

    // --- Library Management ---
    {
        category: "Library Management",
        question: "How do I add games to my library?",
        answer: "You can add games in three ways: manually one-by-one using the 'Add Game' form, using the 'Batch Add' feature to search for and select multiple games at once (or upload a .txt file), or by importing your entire PC library from Steam via the 'My Profile' page."
    },
    {
        category: "Library Management",
        question: "What do all the inputs mean when adding a game?",
        answer: "The 'Add/Edit Game' form allows you to input detailed information: 'Title' is for the game's name; 'Platform' is the console you play it on; 'Genres' are selectable categories; 'List' is its current status (e.g., Backlog); 'Release Date' is its original launch date; 'Playtime' is the estimated hours to beat it; 'Rating' is your personal score from 1-5; and 'Replay Count' is for tracking how many times you've replayed a game, which heavily influences AI recommendations."
    },
    {
        category: "Library Management",
        question: "What if a game is added to one console, but I play it on another?",
        answer: "No problem. You can change the platform at any time. Simply find the game in your library, click the edit button (the pencil icon), and select the correct platform from the dropdown menu in the form."
    },
    {
        category: "Library Management",
        question: "What if a genre I know a game belongs to is not listed?",
        answer: "While we pull a comprehensive list of genres from RAWG, their data can be opinionated. In the 'Add/Edit Game' form, there is a field to 'Add Another Genre'. Simply type in the genre you want, click 'Add', and it will be permanently added to your personal list of available genres for all games."
    },
    {
        category: "Library Management",
        question: "What if I want to play a game again?",
        answer: "The app is designed for this! When you move a game from 'Recently Played' back to 'Now Playing' or 'Backlog', its 'Replay Count' automatically increases. You can also manually adjust this count in the 'Add/Edit Game' form to reflect past playthroughs."
    },

    // --- Features & Settings ---
    {
        category: "Features & Settings",
        question: "How does Steam import work, and what ID can I use?",
        answer: "The Steam import uses the official Steam API to fetch your owned games. To connect your account, you need to provide your Steam ID. This can be your 17-digit SteamID64, your custom vanity URL (e.g., .../id/your-name), or the full URL to your profile page. Your profile must be set to 'Public' for the import to succeed. You can choose a 'Full Import' to replace your PC library or 'Add New Games' to just add titles you don't already have."
    },
    {
        category: "Features & Settings",
        question: "How does Steam Deck compatibility work?",
        answer: "If you enable 'I play on a Steam Deck' in your profile, the app fetches data from ProtonDB, a community-driven database for game compatibility. It displays a badge on your PC games: 'Verified' (works perfectly), 'Playable' (may need tweaks), 'Unsupported' (unplayable), or 'Unknown'. You can manually trigger an update for all your PC games' compatibility status from the Profile page. For more details, visit protondb.com."
    },
    {
        category: "Features-&-Settings",
        question: "What is a 'Completionist' and how does that setting affect my library?",
        answer: "A completionist is a player who aims to finish everything a game has to offer (all side quests, collectibles, achievements, etc.). When you enable the 'Track Completionist Playtime' setting in your profile, the app fetches and displays two playtime estimates: one for the main story and one for 100% completion. The AI also uses this; if you ask for 'a long game to get lost in,' it will factor in the higher completionist playtime for its recommendations."
    },
     {
        category: "Features & Settings",
        question: "Why are there only discounts for Steam games?",
        answer: "Currently, the Steam Web API provides a reliable and publicly accessible way for us to check for discounts on PC games. Unfortunately, there are no feasible, centralized APIs for tracking discounts across console platforms like PlayStation or Xbox that we can reliably integrate into the app at this time."
    },
    {
        category: "Features & Settings",
        question: "Why are Nintendo Switch and Switch 2 games listed together?",
        answer: "We've grouped 'Nintendo Switch' and 'Nintendo Switch 2' to simplify platform selection, as the Switch 2 is expected to have strong backward compatibility with the original Switch catalog. This ensures that games playable on either console are managed under a single, convenient label. A future version of the app may separate them if their libraries significantly diverge."
    },
    {
        category: "Features & Settings",
        question: "Why aren't more consoles available to choose from?",
        answer: "To keep the platform list clean and focused, we've chosen to include the current generation of major consoles. For any older games, retro titles, or emulated games, we've provided the 'Others/ROMs' category as a flexible fallback option to house your entire collection."
    },

    // --- AI Recommendations ---
    {
        category: "AI Recommendations",
        question: "What's the difference between the AI recommendation features?",
        answer: "The app has three distinct AI features: The 'Up Next' queue on your dashboard is an automated, ranked list of games from your backlog you're most likely to enjoy next, based on your overall history. The 'Get AI Recommendations' button is for when you have a specific mood (e.g., 'a short, relaxing puzzle game'). The 'Discover a New Game' orb in the 'Up Next' section is a special feature that finds a 'hidden gem' you don't own, based on your unique taste."
    },
    {
        category: "AI Recommendations",
        question: "Why does the AI mostly recommend games from my library?",
        answer: "The main purpose of Backlog Odyssey is to help you conquer the pile of games you already own! The AI is intentionally focused on helping you work through your backlog without it feeling like work. However, if you're looking for something new, use the 'Discover a New Game' feature (the glowing orb on the dashboard) for recommendations of games not in your library."
    }
];

const categories = [...new Set(faqItems.map(item => item.category))];

export default function FAQPage() {
  return (
    <div className="space-y-12">
       <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">Find answers to common questions about the app's features.</p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="space-y-6">
          <h3 className="text-xl font-semibold text-primary/80">{category.replace(/&/g, ' & ')}</h3>
          <Accordion type="single" collapsible className="w-full">
            {faqItems
              .filter(item => item.category === category)
              .map((item, index) => (
                <AccordionItem value={`item-${category}-${index}`} key={index}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.answer.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>') }} />
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}

    