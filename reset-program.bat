@echo off
echo === ИНСТРУКЦИИ ПО СБРОСУ ПРОГРАММЫ ===
echo.
echo 1. Откройте приложение DianaFit в браузере
echo 2. Нажмите F12 для открытия консоли разработчика
echo 3. В консоли выполните команду:
echo.   
echo    window.clearPrograms()
echo.   
echo 4. После подтверждения выполните:
echo.   
echo    window.recreateProgram()
echo.   
echo 5. Страница автоматически перезагрузится
echo 6. Проверьте, что все ползунки отображаются в центре (положение "не выбрано")
echo.
echo Нажмите любую клавишу для отображения полных инструкций...
pause > nul

node reset-program.js
echo.
echo Нажмите любую клавишу, чтобы закрыть это окно...
pause > nul
