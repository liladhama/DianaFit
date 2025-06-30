@echo off
echo Creating gym workout day folders...

cd "frontend\public\videos\gym"

if not exist "day1_back_shoulders" mkdir "day1_back_shoulders"
if not exist "day2_glutes" mkdir "day2_glutes"  
if not exist "day3_glutes_hamstrings" mkdir "day3_glutes_hamstrings"
if not exist "day4_back_shoulders" mkdir "day4_back_shoulders"
if not exist "day5_glutes_focused" mkdir "day5_glutes_focused"

echo Created all gym workout day folders successfully!
echo.
echo Current structure:
dir /b

echo.
echo Ready for video integration!
echo Please refer to GYM_VIDEO_INTEGRATION_GUIDE.md for video naming and placement instructions.

pause
