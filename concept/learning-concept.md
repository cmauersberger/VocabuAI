columns:
- box (1..5)
- lastAnsweredAt
- correctStreak
- correctTotal
- wrongTotal
- scoreInCurrentBox


Id FlashCardId (FK, unique) 
Box (int) -- 1..5 
ProgressPointsInCurrentBox (int) -- accumulated score inside current box 
CorrectCountsByQuestionTypeInCurrentBox (json, typed)
CorrectCountTotal (int) 
WrongCountTotal (int) 
CorrectStreak (int) 
LastAnsweredAt (datetime)

