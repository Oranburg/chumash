// The Torah blessings (Birkat HaTorah), as they are said at a public reading: the
// blessing before the aliyah and the blessing after it. Both are copied verbatim
// from Sefaria, with the nikud kept and only the HTML stripped. Nothing here is
// typed by hand; the strings were taken from the API and pasted as returned.
//
// Source ref (Sefaria texts API, context=0):
//   "Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Birkat HaTorah"
//   he[5] is the blessing said BEFORE the reading (asher bachar banu).
//   he[7] is the blessing said AFTER the reading (asher natan lanu torat emet).
// Fetched 2026-06-18; see docs/SOURCES.md for the Sefaria policy this app follows.

export const BLESSING_BEFORE = "בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר בָּֽחַר בָּֽנוּ מִכָּל הָעַמִּים וְנָֽתַן לָֽנוּ אֶת תּוֹרָתוֹ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה:";

export const BLESSING_AFTER = "בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָֽתַן לָֽנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה:";
