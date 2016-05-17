sed 's/	/:/g' stockList | sed "s/^/\["\""/" | sed "s/$/"\""\]\,/" | sed "s/:/"\"","\""/g" > stockListParsed.txt
