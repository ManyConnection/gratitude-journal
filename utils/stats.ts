import { GratitudeEntry, WordFrequency, MonthlyStats } from '@/types';

// Common Japanese stop words to filter out
const STOP_WORDS = new Set([
  'の',
  'に',
  'は',
  'を',
  'た',
  'が',
  'で',
  'て',
  'と',
  'し',
  'れ',
  'さ',
  'ある',
  'いる',
  'も',
  'する',
  'から',
  'な',
  'こと',
  'として',
  'い',
  'や',
  'など',
  'なっ',
  'ない',
  'この',
  'ため',
  'その',
  'あっ',
  'よう',
  'また',
  'もの',
  'という',
  'あり',
  'まで',
  'られ',
  'なる',
  'へ',
  'か',
  'だ',
  'これ',
  'によって',
  'により',
  'おり',
  'より',
  'による',
  'ず',
  'なり',
  'られる',
  'において',
  'ば',
  'なかっ',
  'なく',
  'しかし',
  'について',
  'せ',
  'だっ',
  'その他',
  'できる',
  'それ',
  'う',
  'ので',
  'なお',
  'のみ',
  'でき',
  'き',
  'つ',
  'における',
  'および',
  'いう',
  'させ',
  'られた',
  'ただし',
  'かつて',
  'それぞれ',
  'とともに',
  'ただ',
  'ほか',
  'ながら',
  'うち',
  'そして',
  'とき',
  'したがって',
  'に関する',
  'ほど',
  'ところ',
  'ここ',
  'あと',
  'くれ',
  'くれた',
  'もらっ',
  'です',
  'でした',
  'ます',
  'ました',
]);

// Simple word tokenizer (basic Japanese/English word extraction)
export function tokenizeText(text: string): string[] {
  // Remove common punctuation and split
  const cleaned = text
    .toLowerCase()
    .replace(/[。、！？「」『』（）【】\[\]{}.,!?:;'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words (basic approach - splits on spaces and some Japanese particles)
  const words = cleaned.split(/\s+/);

  // Filter out stop words, very short words, and numbers
  return words.filter((word) => {
    if (word.length < 2) return false;
    if (STOP_WORDS.has(word)) return false;
    if (/^\d+$/.test(word)) return false;
    return true;
  });
}

// Calculate word frequencies from entries
export function calculateWordFrequencies(entries: GratitudeEntry[]): WordFrequency[] {
  const frequencyMap = new Map<string, number>();

  for (const entry of entries) {
    for (const item of entry.items) {
      const words = tokenizeText(item);
      for (const word of words) {
        frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
      }
    }
  }

  // Convert to array and sort by count
  const frequencies: WordFrequency[] = Array.from(frequencyMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return frequencies;
}

// Get top N words
export function getTopWords(entries: GratitudeEntry[], limit: number = 10): WordFrequency[] {
  const frequencies = calculateWordFrequencies(entries);
  return frequencies.slice(0, limit);
}

// Calculate monthly statistics
export function calculateMonthlyStats(
  entries: GratitudeEntry[],
  yearMonth: string
): MonthlyStats {
  const monthEntries = entries.filter((e) => e.date.startsWith(yearMonth));

  const topWords = getTopWords(monthEntries, 20);
  const totalItems = monthEntries.reduce((sum, e) => sum + e.items.length, 0);

  return {
    month: yearMonth,
    entryCount: monthEntries.length,
    topWords,
    averageItemsPerDay: monthEntries.length > 0 ? totalItems / monthEntries.length : 0,
  };
}

// Get month string for current month
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Format month for display
export function formatMonthDisplay(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}年${parseInt(month)}月`;
}

// Get previous month string
export function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1); // month - 2 because months are 0-indexed
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Get next month string
export function getNextMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month, 1); // month because months are 0-indexed, so this is next month
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
