# The chumash study partner: design

This is the design decision for the AI study partner in chumash, derived from a beit-midrash consultation on how chumash is actually studied. It is deliberately different from havruta's daf partner, because a parsha is not a daf.

## The difference in one line

The daf havruta challenges your reading of an argument. The chumash partner opens the conversation among the commentators about a verse.

## The few facts about chumash study that drive the design

The unit is the verse, not the sequential line. A daf is built as argument and is read line by line because the lines are causally connected. A verse is complete in itself, and the learner comes to a specific verse, often the one that came up in the Shabbat drasha or that confused her in the week's reading.

Peshat is the first question, not the only one. The plain, contextual sense comes first, and it is already contested among the commentators. The learner asks what the most natural reading is and why it is hard to hold.

"What is bothering Rashi" is the method. Associated with Nehama Leibowitz, the discipline is: read the verse, feel the difficulty, then read a commentator's note as a proposed resolution of that specific difficulty. A comment is only intelligible once you can name the problem it answers.

The major commentators differ in posture, not just conclusion. Rashi blends peshat and midrash; Rashbam presses peshat, sometimes against his grandfather; Ibn Ezra brings grammar and philology; Ramban asks theological and structural questions; Sforno reads for moral and philosophical meaning. Reading them against each other on one verse is the proper mode.

Targum Onkelos is interpretive, not neutral. Its paraphrases, especially around anthropomorphism, are claims about the verse that the commentators argue with.

The rhythm is weekly. The parsha arrives through shnayim mikra (twice in Hebrew, once in Targum, before Shabbat), the Shabbat reading divided into aliyot, and the week's shiur and drasha. It repeats annually, so the learner brings last year's understanding to this year's verse.

Genres differ. Narrative, law, poetry, and genealogy invite different questions and lean on different commentators.

## The partner's posture

A beit midrash companion who has the commentators open in front of him and works through the verse alongside the learner. He does not deliver the Rashi; he asks what the learner noticed or found hard, then says what a commentator proposes for that difficulty, then asks what she thinks. The challenge runs through the commentators' disagreements rather than from the text's own counter-argument.

The havruta commitments still hold. The human acts first: the learner writes what she notices before the partner speaks. The partner does not cave to a wrong reading, and it never invents a source. The tone is warmer than the daf partner, because the verse is not itself an argument the learner must track, but it still pushes.

## Backend

Source stack, all from Sefaria, fetched on demand and quoted only from what comes back: the Hebrew verse, Targum Onkelos, Rashi, Rashbam, Ibn Ezra, Ramban, Sforno. The same fetch-or-stay-silent discipline as the daf havruta. The commentators are widely misquoted, so a confident invented Rashi with a citation is a serious failure and must be impossible by construction.

Engagement logic, at the verse level:
- The learner reads the verse, with word-level transliteration on tap.
- The learner writes what she notices: a difficulty, a question, or what she thinks it means.
- The partner responds to what she wrote. If she named a real difficulty, it brings what one or more commentators say about that, fetched live, and asks whether the resolution satisfies her.
- If she missed the difficulty, it asks whether anything seems unusual in the verse before supplying it.
- It introduces multiple commentators only when they genuinely disagree in a way she can engage. One clear disagreement beats five names in a list.

Prompt posture, where it differs from the daf havruta:
- The organizing question is "what in this verse is hard, and what do the commentators say about that," not "what does your reading have to account for."
- Model the Leibowitz method explicitly: every commentator note is introduced by naming the textual difficulty that prompted it, before the resolution.
- Flag peshat versus derash when relevant, and name which commentator is in which mode rather than flattening them.
- Onkelos is summarized in English from Sefaria's English; its Aramaic is not transliterated, per the JEW README convention.
- The partner knows the parsha's place in the week and can invoke the shnayim mikra rhythm to situate the learner.

Calibration: built for a serious but self-described casual scholar who reads parsha, knows the alphabet, and looks things up. Meet her there. Do not assume philological competence; do not condescend. The Leibowitz method fits this learner exactly.

## Frontend

The text view shows the week's portion in Hebrew with nikud, cantillation off by default, the aliyot marked, and the word-tap transliteration popover carried over from havruta. The reference for serious parsha study is the mikraot gedolot page (the Torah text flanked by Onkelos, Rashi, and other commentators); the app need not replicate that layout but should be informed by it.

The commentators (Rashi, Rashbam, Ibn Ezra, Ramban, Sforno, Onkelos) are accessible by tap, each in Hebrew or Aramaic with the Sefaria English. The learner can read them directly without the partner. The partner is for when she wants to engage, not the only way to read.

The partner is invoked per verse, by a distinct action ("study this verse with your havruta") that opens the input box and enforces the human-acts-first gate. The partner stays silent on verses the learner has not chosen.

An aliyah-level synthesis is offered optionally after the learner has worked several verses, the counterpart to the daf havruta's sugya synthesis, but optional because the verse-level work stands on its own.

The parsha calendar drives navigation: the current parsha, the aliyot, and where the learner is in the shnayim mikra reading. This is a navigation aid, not a gate; any verse in any parsha is reachable.

There is no drasha mode. The partner does not produce a dvar Torah or a thematic essay. It engages specific verses, the same way the daf havruta refuses to be the oracle.

## The differences from havruta, for the build

The adversarial first move is replaced by the "what is bothering Rashi" move. The unit is the verse with tap-to-engage, not the sequential line. The source stack is the parshanim, not the Talmudic apparatus. The weekly rhythm and aliyot live in the UI, not the daily daf. The synthesis is optional and aliyah-level. The tone is less adversarial, but human-acts-first, never-cave, and never-invent all carry over unchanged.
