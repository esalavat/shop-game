// Words a shop name can't contain (GDD #91, §18 #21). Names are typed by kids and shown to whoever they
// share a link with, so this errs on the side of blocking. sim/shopName.js lowercases the name, strips
// accents, undoes look-alike digits and symbols (0 → o, $ → s, ...) and squeezes repeated letters before
// checking, so list words in plain lowercase letters with no doubled letters where a squeeze would
// remove them (the check squeezes both sides).
//
// ANYWHERE: blocked even inside a longer word or with spaces between the letters ("f u c k").
// WHOLE: only blocked as a whole word, because they hide inside innocent words (class, peacock, grape,
// canal, raccoon, title, cucumber, arsenal, pussycat).

export const ANYWHERE = [
  'fuck', 'fuk', 'fck', 'shit', 'cunt', 'bitch', 'bastard', 'asshole', 'arsehole', 'motherf', 'bollock', 'wanker',
  'twat', 'piss', 'slut', 'whore', 'porn', 'dildo', 'jizz', 'penis', 'vagina', 'clitoris', 'blowjob', 'handjob',
  'nigger', 'nigga', 'faggot', 'retard', 'nazi', 'hitler', 'kkk', 'wetback', 'kike', 'chink',
  'stfu', 'wtf',
];

export const WHOLE = [
  'ass', 'asses', 'arse', 'butt', 'butthole', 'cock', 'cocks', 'wank', 'dick', 'dicks', 'tit', 'tits', 'titty', 'titties', 'boob',
  'boobs', 'booby', 'cum', 'sex', 'sexy', 'rape', 'raped', 'rapist', 'anal', 'anus', 'pussy', 'horny', 'nude', 'nudes',
  'naked', 'milf', 'damn', 'crap', 'hell', 'fag', 'fags', 'dyke', 'tranny', 'spic', 'coon', 'gook', 'paki', 'homo',
  'kill', 'suicide', 'drugs', 'weed', 'cocaine', 'meth', 'vape', 'beer', 'vodka', 'gun', 'guns',
];
