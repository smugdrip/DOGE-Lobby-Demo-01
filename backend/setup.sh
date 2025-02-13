#!/bin/bash

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
else
    echo "Virtual environment already exists"
fi

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

which python
which python3

python -m pip install --upgrade pip

pip install fastapi[standard]