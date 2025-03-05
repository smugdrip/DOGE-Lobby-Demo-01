#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
else
    echo -e "${GREEN}Virtual environment already exists${NC}"
fi

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
    echo -e "${GREEN}Activated Windows virtual environment${NC}"
else
    source .venv/bin/activate
    echo -e "${GREEN}Activated Mac virtual environment${NC}"
fi

which python
which python3

python -m pip install --upgrade pip

pip install -r requirements.txt

# echo -e "${GREEN}Setup complete. Run ${RED}source .venv/Scripts/activate${GREEN} for Windows or ${RED}source .venv/bin/activate${GREEN} for Mac to activate it, then run ${GREEN}fastapi dev main.py${NC}"

fastapi dev main.py